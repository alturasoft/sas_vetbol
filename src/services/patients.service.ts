import { supabase } from '@/config/supabase'
import { storageService } from '@/services/storage.service'
import { assertPermission } from '@/lib/permissions'
import type { Mascotas, MascotaConCliente } from '@/types/patient.types'

export interface PatientFilters {
  searchTerm?: string
  species?: string
  estado?: string
  idCliente?: number
}

export const patientsService = {
  /**
   * Obtiene las mascotas de la clínica con datos de su propietario
   */
  async getPatients(idVeterinaria: number, filters?: PatientFilters): Promise<MascotaConCliente[]> {
    let query = supabase
      .from('mascotas')
      .select('*, cliente:clientes(*)')
      .eq('id_veterinaria', idVeterinaria)
      .order('fecha_crea', { ascending: false })

    if (filters?.searchTerm) {
      const term = filters.searchTerm.trim()
      query = query.or(`nombre.ilike.%${term}%,raza.ilike.%${term}%,especie.ilike.%${term}%`)
    }

    if (filters?.species && filters.species !== 'ALL') {
      query = query.ilike('especie', `%${filters.species}%`)
    }

    if (filters?.estado && filters.estado !== 'ALL') {
      query = query.eq('estado', filters.estado)
    }

    if (filters?.idCliente) {
      query = query.eq('id_cliente', filters.idCliente)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener pacientes:', error)
      throw error
    }

    return (data as unknown as MascotaConCliente[]) || []

  },

  /**
   * Obtiene una mascota específica por su ID
   */
  async getPatientById(idMascota: number): Promise<MascotaConCliente | null> {
    const { data, error } = await supabase
      .from('mascotas')
      .select('*, cliente:clientes(*)')
      .eq('id_mascota', idMascota)
      .maybeSingle()

    if (error) {
      console.error('Error al obtener detalle del paciente:', error)
      throw error
    }

    return (data as unknown as MascotaConCliente) || null

  },

  /**
   * Registra una nueva mascota
   */
  async createPatient(patient: Omit<Mascotas, 'id_mascota' | 'fecha_crea'>): Promise<Mascotas> {
    assertPermission('CREAR_MASCOTAS', 'registrar nuevos pacientes')

    const { data, error } = await supabase
      .from('mascotas')
      .insert({
        ...patient,
        fecha_crea: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar mascota:', error)
      throw error
    }

    return data
  },

  /**
   * Actualiza los datos de una mascota
   */
  async updatePatient(idMascota: number, updates: Partial<Mascotas>): Promise<Mascotas> {
    assertPermission('EDITAR_MASCOTAS', 'modificar información de pacientes')

    const { data, error } = await supabase
      .from('mascotas')
      .update(updates)
      .eq('id_mascota', idMascota)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar mascota:', error)
      throw error
    }

    return data
  },

  /**
   * Eliminación lógica / baja de mascota
   */
  async deletePatient(idMascota: number): Promise<void> {
    assertPermission('ELIMINAR_MASCOTAS', 'dar de baja o eliminar pacientes')

    try {
      const patient = await this.getPatientById(idMascota)
      if (patient?.foto_url) {
        await storageService.deletePatientPhoto(patient.foto_url)
      }
    } catch (e) {
      console.warn('No se pudo verificar o eliminar foto de storage al borrar paciente:', e)
    }

    const { error } = await supabase
      .from('mascotas')
      .delete()
      .eq('id_mascota', idMascota)

    if (error) {
      console.error('Error al eliminar paciente:', error)
      throw error
    }
  }
}
