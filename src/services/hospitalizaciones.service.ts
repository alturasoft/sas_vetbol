import { supabase } from '@/config/supabase'
import { assertPermission } from '@/lib/permissions'
import type {
  Hospitalizacion,
  EvolucionHospitalizacion,
  NuevaHospitalizacionInput,
  NuevaEvolucionInput,
} from '@/types/hospitalizacion.types'

export const hospitalizacionesService = {
  /**
   * Obtiene la lista de hospitalizaciones para una clínica
   */
  async getHospitalizaciones(
    idVeterinaria: number,
    options?: { soloInternados?: boolean; search?: string }
  ): Promise<Hospitalizacion[]> {
    let query = supabase
      .from('hospitalizaciones')
      .select(`
        *,
        mascota:mascotas (
          id_mascota,
          nombre,
          especie,
          raza,
          foto_url,
          estado,
          peso,
          cliente:clientes (
            id_cliente,
            nombres,
            apellidos,
            telefono
          )
        )
      `)
      .eq('id_veterinaria', idVeterinaria)
      .order('fecha_ingreso', { ascending: false })

    if (options?.soloInternados) {
      query = query.eq('estado', 'INTERNADO')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener hospitalizaciones:', error)
      throw error
    }

    let results = (data as unknown as Hospitalizacion[]) || []

    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim()
      results = results.filter((h) => {
        const petName = h.mascota?.nombre?.toLowerCase() || ''
        const clientName = `${h.mascota?.cliente?.nombres || ''} ${h.mascota?.cliente?.apellidos || ''}`.toLowerCase()
        const habitacion = h.habitacion?.toLowerCase() || ''
        const motivo = h.motivo_ingreso?.toLowerCase() || ''
        return (
          petName.includes(term) ||
          clientName.includes(term) ||
          habitacion.includes(term) ||
          motivo.includes(term)
        )
      })
    }

    return results
  },

  /**
   * Obtiene una hospitalización por su ID con datos completos
   */
  async getHospitalizacionById(idHospitalizacion: number): Promise<Hospitalizacion | null> {
    const { data, error } = await supabase
      .from('hospitalizaciones')
      .select(`
        *,
        mascota:mascotas (
          id_mascota,
          nombre,
          especie,
          raza,
          foto_url,
          estado,
          peso,
          cliente:clientes (
            id_cliente,
            nombres,
            apellidos,
            telefono
          )
        )
      `)
      .eq('id_hospitalizacion', idHospitalizacion)
      .maybeSingle()

    if (error) {
      console.error('Error al obtener detalle de hospitalización:', error)
      throw error
    }

    return (data as unknown as Hospitalizacion) || null
  },

  /**
   * Registra un nuevo ingreso a hospitalización
   */
  async crearHospitalizacion(
    payload: NuevaHospitalizacionInput & { id_veterinaria: number }
  ): Promise<Hospitalizacion> {
    assertPermission('HOSPITALIZACION_OP', 'ingresar pacientes a hospitalización')

    const { data, error } = await supabase
      .from('hospitalizaciones')
      .insert({
        id_veterinaria: payload.id_veterinaria,
        id_mascota: payload.id_mascota,
        fecha_ingreso: payload.fecha_ingreso,
        motivo_ingreso: payload.motivo_ingreso,
        motivo: payload.motivo_ingreso, // Compatibilidad con vistas previas
        habitacion: payload.habitacion || null,
        observaciones: payload.observaciones || null,
        estado: 'INTERNADO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar hospitalización:', error)
      throw error
    }

    return data as unknown as Hospitalizacion
  },

  /**
   * Da de alta médica a un paciente hospitalizado
   */
  async darAlta(idHospitalizacion: number, observacionesAlta: string): Promise<void> {
    assertPermission('HOSPITALIZACION_OP', 'dar de alta a pacientes internados')

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('hospitalizaciones')
      .update({
        estado: 'ALTA',
        fecha_alta: now,
        observaciones: observacionesAlta,
        updated_at: now,
      })
      .eq('id_hospitalizacion', idHospitalizacion)

    if (error) {
      console.error('Error al dar de alta hospitalización:', error)
      throw error
    }
  },

  /**
   * Actualiza datos como habitación u observaciones de una hospitalización
   */
  async actualizarHospitalizacion(
    idHospitalizacion: number,
    updates: Partial<Hospitalizacion>
  ): Promise<void> {
    const { error } = await supabase
      .from('hospitalizaciones')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id_hospitalizacion', idHospitalizacion)

    if (error) {
      console.error('Error al actualizar hospitalización:', error)
      throw error
    }
  },

  /**
   * Obtiene la lista de evoluciones para una hospitalización
   */
  async getEvoluciones(idHospitalizacion: number): Promise<EvolucionHospitalizacion[]> {
    const { data, error } = await supabase
      .from('historia_evolucion_hospitalizacion')
      .select(`
        *,
        personal:personal (
          nombres,
          apellidos
        )
      `)
      .eq('id_hospitalizacion', idHospitalizacion)
      .order('fecha_evolucion', { ascending: false })

    if (error) {
      console.error('Error al obtener evoluciones:', error)
      throw error
    }

    return (data as unknown as EvolucionHospitalizacion[]) || []
  },

  /**
   * Registra una nota de evolución médica horaria
   */
  async addEvolucion(
    payload: NuevaEvolucionInput & { id_personal?: number | null }
  ): Promise<EvolucionHospitalizacion> {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('historia_evolucion_hospitalizacion')
      .insert({
        id_hospitalizacion: payload.id_hospitalizacion,
        fecha_evolucion: now,
        nota: payload.nota,
        descripcion: payload.nota, // Compatibilidad si la columna es descripcion
        id_personal: payload.id_personal || null,
        temperatura: payload.temperatura ? String(payload.temperatura) : null,
        peso: payload.peso ? String(payload.peso) : null,
        frecuencia_cardiaca: payload.frecuencia_cardiaca ? String(payload.frecuencia_cardiaca) : null,
        frecuencia_respiratoria: payload.frecuencia_respiratoria ? String(payload.frecuencia_respiratoria) : null,
        tratamiento: payload.tratamiento || null,
        created_at: now,
      })
      .select(`
        *,
        personal:personal (
          nombres,
          apellidos
        )
      `)
      .single()

    if (error) {
      console.error('Error al agregar evolución médica:', error)
      throw error
    }

    return data as unknown as EvolucionHospitalizacion
  },
}
