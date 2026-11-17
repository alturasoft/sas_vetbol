import { supabase } from '@/config/supabase'
import { assertPermission } from '@/lib/permissions'
import type {
  Cirugia,
  EstadoCirugia,
  NuevaCirugiaInput,
} from '@/types/cirugia.types'

export const cirugiasService = {
  /**
   * Obtiene la agenda de cirugías para una clínica veterinaria
   */
  async getCirugias(
    idVeterinaria: number,
    options?: { filterStatus?: EstadoCirugia | 'TODAS'; search?: string }
  ): Promise<Cirugia[]> {
    let query = supabase
      .from('cirugias')
      .select(`
        *,
        mascota:mascotas (
          id_mascota,
          nombre,
          especie,
          raza,
          foto_url,
          estado,
          cliente:clientes (
            id_cliente,
            nombres,
            apellidos,
            telefono
          )
        )
      `)
      .eq('id_veterinaria', idVeterinaria)
      .order('fecha_cirugia', { ascending: true })

    if (options?.filterStatus && options.filterStatus !== 'TODAS') {
      query = query.eq('estado', options.filterStatus)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener cirugías:', error)
      throw error
    }

    let results = (data as unknown as Cirugia[]) || []

    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim()
      results = results.filter((c) => {
        const petName = c.mascota?.nombre?.toLowerCase() || ''
        const clientName = `${c.mascota?.cliente?.nombres || ''} ${c.mascota?.cliente?.apellidos || ''}`.toLowerCase()
        const procedimiento = c.procedimiento?.toLowerCase() || ''
        const cirujano = c.cirujano?.toLowerCase() || ''
        return (
          petName.includes(term) ||
          clientName.includes(term) ||
          procedimiento.includes(term) ||
          cirujano.includes(term)
        )
      })
    }

    return results
  },

  /**
   * Obtiene el detalle de una cirugía por ID
   */
  async getCirugiaById(idCirugia: number): Promise<Cirugia | null> {
    const { data, error } = await supabase
      .from('cirugias')
      .select(`
        *,
        mascota:mascotas (
          id_mascota,
          nombre,
          especie,
          raza,
          foto_url,
          estado,
          cliente:clientes (
            id_cliente,
            nombres,
            apellidos,
            telefono
          )
        )
      `)
      .eq('id_cirugia', idCirugia)
      .maybeSingle()

    if (error) {
      console.error('Error al obtener detalle de cirugía:', error)
      throw error
    }

    return (data as unknown as Cirugia) || null
  },

  /**
   * Registra y programa una nueva cirugía
   */
  async crearCirugia(
    payload: NuevaCirugiaInput & { id_veterinaria: number }
  ): Promise<Cirugia> {
    assertPermission('CIRUGIA_OP', 'programar intervenciones quirúrgicas')

    const { data, error } = await supabase
      .from('cirugias')
      .insert({
        id_veterinaria: payload.id_veterinaria,
        id_mascota: payload.id_mascota,
        fecha_cirugia: payload.fecha_cirugia,
        procedimiento: payload.procedimiento,
        tipo_cirugia: payload.procedimiento, // Compatibilidad con vistas previas
        cirujano: payload.cirujano,
        anestesia: payload.anestesia || null,
        observaciones: payload.observaciones || null,
        estado: 'PROGRAMADA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar cirugía:', error)
      throw error
    }

    return data as unknown as Cirugia
  },

  /**
   * Cambia el estado a EN_PROCESO ("Iniciar Cirugía")
   */
  async iniciarCirugia(idCirugia: number): Promise<void> {
    assertPermission('CIRUGIA_OP', 'iniciar procedimientos quirúrgicos')

    const { error } = await supabase
      .from('cirugias')
      .update({
        estado: 'EN_PROCESO',
        updated_at: new Date().toISOString(),
      })
      .eq('id_cirugia', idCirugia)

    if (error) {
      console.error('Error al iniciar procedimiento quirúrgico:', error)
      throw error
    }
  },

  /**
   * Finaliza la cirugía guardando el protocolo operatorio formal (hallazgos y complicaciones)
   */
  async finalizarCirugia(
    idCirugia: number,
    hallazgos: string,
    complicaciones?: string
  ): Promise<void> {
    assertPermission('CIRUGIA_OP', 'finalizar cirugías y registrar protocolos')

    const protocolo = `HALLAZGOS: ${hallazgos}\nCOMPLICACIONES: ${complicaciones || 'Ninguna'}`
    const { error } = await supabase
      .from('cirugias')
      .update({
        estado: 'FINALIZADA',
        resultado: hallazgos, // Compatibilidad
        complicaciones: complicaciones || 'Ninguna', // Compatibilidad
        observaciones: protocolo,
        updated_at: new Date().toISOString(),
      })
      .eq('id_cirugia', idCirugia)

    if (error) {
      console.error('Error al finalizar cirugía:', error)
      throw error
    }
  },

  /**
   * Cancela una intervención programada
   */
  async cancelarCirugia(idCirugia: number, motivo?: string): Promise<void> {
    const { error } = await supabase
      .from('cirugias')
      .update({
        estado: 'CANCELADA',
        observaciones: motivo ? `CANCELACIÓN: ${motivo}` : 'Intervención cancelada',
        updated_at: new Date().toISOString(),
      })
      .eq('id_cirugia', idCirugia)

    if (error) {
      console.error('Error al cancelar cirugía:', error)
      throw error
    }
  },
}
