import { supabase } from '@/config/supabase'
import { storageService } from './storage.service'
import { assertPermission } from '@/lib/permissions'
import type {
  HistoriasClinicas,
  HistoriaSignosVitales,
  HistoriaDiagnosticos,
  HistoriaTratamientos,
  HistoriaRecetas,
  HistoriaExamenes,
  HistoriaArchivos,
  VwTimelineClinico,
  ConsultaDetallada,
  CreateHistoriaCabeceraInput,
  UpdateHistoriaCabeceraInput,
  UpsertSignosVitalesInput,
  CreateDiagnosticoInput,
  CreateTratamientoInput,
  CreateRecetaInput,
  CreateExamenInput,
  CreateArchivoClinicoInput,
} from '@/types/medical-record.types'

export interface MedicalRecordFilters {
  searchTerm?: string
  estado?: string
  idMascota?: number
  fechaDesde?: string
  fechaHasta?: string
}

export const medicalRecordsService = {
  /**
   * Obtiene la lista de historias clínicas para la veterinaria activa
   */
  async getMedicalRecords(
    idVeterinaria: number,
    filters?: MedicalRecordFilters
  ): Promise<ConsultaDetallada[]> {
    let query = supabase
      .from('historias_clinicas')
      .select(`
        *,
        mascota:mascotas(*),
        cliente:clientes(*),
        personal:personal(*),
        signos_vitales:historia_signos_vitales(*),
        diagnosticos:historia_diagnosticos(*)
      `)
      .eq('id_veterinaria', idVeterinaria)
      .order('fecha_consulta', { ascending: false })
      .order('id_historia_clinica', { ascending: false })

    if (filters?.idMascota) {
      query = query.eq('id_mascota', filters.idMascota)
    }

    if (filters?.estado && filters.estado !== 'ALL') {
      query = query.eq('estado', filters.estado)
    }

    if (filters?.fechaDesde) {
      query = query.gte('fecha_consulta', filters.fechaDesde)
    }

    if (filters?.fechaHasta) {
      query = query.lte('fecha_consulta', filters.fechaHasta)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener historias clínicas:', error)
      throw error
    }

    let records = (data as unknown as ConsultaDetallada[]) || []

    if (filters?.searchTerm) {
      const term = filters.searchTerm.trim().toLowerCase()
      records = records.filter((r) => {
        const petName = (r.mascota as any)?.nombre?.toLowerCase() || ''
        const clientName = (r.cliente as any)
          ? `${(r.cliente as any).nombres || ''} ${(r.cliente as any).apellidos || ''}`.toLowerCase()
          : ''
        const reason = r.motivo_consulta?.toLowerCase() || ''
        const recordNum = r.numero_historia?.toLowerCase() || ''
        return (
          petName.includes(term) ||
          clientName.includes(term) ||
          reason.includes(term) ||
          recordNum.includes(term)
        )
      })
    }

    return records
  },

  /**
   * Carga completa e hidratación de una historia clínica con todas sus sub-entidades
   */
  async getMedicalRecordById(idHistoria: number): Promise<ConsultaDetallada | null> {
    const { data, error } = await supabase
      .from('historias_clinicas')
      .select(`
        *,
        mascota:mascotas(*, cliente:clientes(*)),
        cliente:clientes(*),
        personal:personal(*),
        signos_vitales:historia_signos_vitales(*),
        diagnosticos:historia_diagnosticos(*),
        tratamientos:historia_tratamientos(*),
        recetas:historia_recetas(*),
        examenes:historia_examenes(*),
        archivos:historia_archivos(*)
      `)
      .eq('id_historia_clinica', idHistoria)
      .maybeSingle()

    if (error) {
      console.error('Error al cargar detalle de historia clínica:', error)
      throw error
    }

    return (data as unknown as ConsultaDetallada) || null
  },

  /**
   * Paso 1: Inserta la cabecera en estado ABIERTA
   */
  async createHistoriaCabecera(data: CreateHistoriaCabeceraInput): Promise<HistoriasClinicas> {
    assertPermission('CREAR_CONSULTA', 'registrar nuevas consultas clínicas')

    const numeroHistoria =
      data.numero_historia ||
      `HC-${data.id_veterinaria}-${data.id_mascota}-${Date.now().toString().slice(-6)}`

    const payload = {
      id_veterinaria: data.id_veterinaria,
      id_mascota: data.id_mascota,
      id_cliente: data.id_cliente,
      id_personal: data.id_personal || null,
      numero_historia: numeroHistoria,
      fecha_consulta: data.fecha_consulta || new Date().toISOString(),
      tipo_consulta: data.tipo_consulta || 'Consulta General',
      motivo_consulta: data.motivo_consulta,
      anamnesis: data.anamnesis,
      estado_general: data.estado_general || 'BUENO',
      observaciones: data.observaciones || null,
      estado: data.estado || 'ABIERTA',
    }

    const { data: record, error } = await supabase
      .from('historias_clinicas')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error al crear cabecera de historia clínica:', error)
      throw error
    }

    return record
  },

  /**
   * Paso 1 (Actualización si ya existe id_historia_clinica)
   */
  async updateHistoriaCabecera(
    idHistoria: number,
    data: UpdateHistoriaCabeceraInput
  ): Promise<HistoriasClinicas> {
    assertPermission('EDITAR_CONSULTA', 'modificar consultas clínicas')

    const { data: record, error } = await supabase
      .from('historias_clinicas')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id_historia_clinica', idHistoria)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar cabecera de historia clínica:', error)
      throw error
    }

    return record
  },

  /**
   * Paso 2: Constantes y signos vitales (UPSERT por id_historia_clinica)
   */
  async upsertSignosVitales(data: UpsertSignosVitalesInput): Promise<HistoriaSignosVitales> {
    const { data: result, error } = await supabase
      .from('historia_signos_vitales')
      .upsert(data, { onConflict: 'id_historia_clinica' })
      .select()
      .single()

    if (error) {
      console.error('Error al guardar signos vitales:', error)
      throw error
    }

    return result
  },

  /**
   * Paso 3: Diagnósticos (INSERT atómico)
   */
  async addDiagnostico(data: CreateDiagnosticoInput): Promise<HistoriaDiagnosticos> {
    const { data: result, error } = await supabase
      .from('historia_diagnosticos')
      .insert({
        id_historia_clinica: data.id_historia_clinica,
        diagnostico: data.diagnostico,
        tipo_diagnostico: data.tipo_diagnostico || 'PRESUNTIVO',
        gravedad: data.gravedad || 'LEVE',
        codigo_cie_vet: data.codigo_cie_vet || null,
        observaciones: data.observaciones || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar diagnóstico:', error)
      throw error
    }

    return result
  },

  /**
   * Paso 3: Eliminación atómica de diagnóstico
   */
  async deleteDiagnostico(idDiagnostico: number): Promise<void> {
    const { error } = await supabase
      .from('historia_diagnosticos')
      .delete()
      .eq('id_diagnostico', idDiagnostico)

    if (error) {
      console.error('Error al eliminar diagnóstico:', error)
      throw error
    }
  },

  /**
   * Paso 4: Tratamientos (INSERT atómico)
   */
  async addTratamiento(data: CreateTratamientoInput): Promise<HistoriaTratamientos> {
    const { data: result, error } = await supabase
      .from('historia_tratamientos')
      .insert({
        id_historia_clinica: data.id_historia_clinica,
        tratamiento: data.tratamiento,
        indicaciones: data.indicaciones || null,
        duracion_dias: data.duracion_dias || null,
        estado: data.estado || 'ACTIVO',
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar tratamiento:', error)
      throw error
    }

    return result
  },

  /**
   * Paso 4: Eliminación atómica de tratamiento
   */
  async deleteTratamiento(idTratamiento: number): Promise<void> {
    const { error } = await supabase
      .from('historia_tratamientos')
      .delete()
      .eq('id_tratamiento', idTratamiento)

    if (error) {
      console.error('Error al eliminar tratamiento:', error)
      throw error
    }
  },

  /**
   * Paso 5: Recetas Farmacológicas (INSERT atómico)
   */
  async addReceta(data: CreateRecetaInput): Promise<HistoriaRecetas> {
    const { data: result, error } = await supabase
      .from('historia_recetas')
      .insert({
        id_historia_clinica: data.id_historia_clinica,
        medicamento: data.medicamento,
        dosis: data.dosis || null,
        frecuencia: data.frecuencia || 'Cada 12 horas',
        via_administracion: data.via_administracion || 'Oral',
        duracion: data.duracion || null,
        instrucciones: data.instrucciones || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar receta:', error)
      throw error
    }

    return result
  },

  /**
   * Paso 5: Eliminación atómica de receta
   */
  async deleteReceta(idReceta: number): Promise<void> {
    const { error } = await supabase
      .from('historia_recetas')
      .delete()
      .eq('id_receta', idReceta)

    if (error) {
      console.error('Error al eliminar receta:', error)
      throw error
    }
  },

  /**
   * Paso 6: Exámenes Complementarios (INSERT atómico)
   */
  async addExamen(data: CreateExamenInput): Promise<HistoriaExamenes> {
    const { data: result, error } = await supabase
      .from('historia_examenes')
      .insert({
        id_historia_clinica: data.id_historia_clinica,
        tipo_examen: data.tipo_examen,
        resultado: data.resultado || null,
        archivo_resultado: data.archivo_resultado || null,
        fecha_examen: data.fecha_examen || new Date().toISOString(),
        laboratorio: data.laboratorio || null,
        observaciones: data.observaciones || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar examen:', error)
      throw error
    }

    return result
  },

  /**
   * Paso 6: Eliminación atómica de examen
   */
  async deleteExamen(idExamen: number): Promise<void> {
    const { error } = await supabase
      .from('historia_examenes')
      .delete()
      .eq('id_examen', idExamen)

    if (error) {
      console.error('Error al eliminar examen:', error)
      throw error
    }
  },

  /**
   * Paso 7: Registro en BD de archivo clínico subido
   */
  async addArchivo(data: CreateArchivoClinicoInput): Promise<HistoriaArchivos> {
    const { data: result, error } = await supabase
      .from('historia_archivos')
      .insert({
        id_historia_clinica: data.id_historia_clinica,
        tipo_archivo: data.tipo_archivo || 'FOTO',
        nombre_archivo: data.nombre_archivo || null,
        url_archivo: data.url_archivo,
        extension: data.extension || null,
        tamano_kb: data.tamano_kb || null,
        observaciones: data.observaciones || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar archivo clínico en BD:', error)
      throw error
    }

    return result
  },

  /**
   * Paso 7: Eliminación de archivo clínico de BD y Storage
   */
  async deleteArchivo(idArchivo: number, urlArchivo?: string): Promise<void> {
    if (urlArchivo) {
      try {
        await storageService.deleteMedicalRecordFile(urlArchivo)
      } catch (err) {
        console.warn('No se pudo remover el archivo físico de Storage:', err)
      }
    }

    const { error } = await supabase
      .from('historia_archivos')
      .delete()
      .eq('id_archivo', idArchivo)

    if (error) {
      console.error('Error al eliminar archivo clínico de BD:', error)
      throw error
    }
  },

  /**
   * Paso 8: Cierre definitivo de la consulta médica
   */
  async finalizarConsulta(idHistoria: number): Promise<HistoriasClinicas> {
    const { data, error } = await supabase
      .from('historias_clinicas')
      .update({
        estado: 'CERRADA',
        updated_at: new Date().toISOString(),
      })
      .eq('id_historia_clinica', idHistoria)
      .select()
      .single()

    if (error) {
      console.error('Error al finalizar consulta médica:', error)
      throw error
    }

    return data
  },

  /**
   * Obtiene el timeline clínico de la mascota desde la vista vw_timeline_clinico
   */
  async getTimelineClinico(
    idVeterinaria: number,
    idMascota?: number
  ): Promise<VwTimelineClinico[]> {
    let query = supabase
      .from('vw_timeline_clinico')
      .select('*')
      .eq('id_veterinaria', idVeterinaria)
      .order('fecha_consulta', { ascending: false })

    if (idMascota) {
      query = query.eq('id_mascota', idMascota)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener timeline clínico:', error)
      throw error
    }

    return (data as unknown as VwTimelineClinico[]) || []
  },
}
