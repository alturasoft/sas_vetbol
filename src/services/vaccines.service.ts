import { supabase } from '@/config/supabase'
import type { HistorialVacunas } from '@/types/database.types'

export interface VaccineDraft {
  nombre_vacuna: string
  fecha?: string
  dosis?: string
  requiere_refuerzo: 'SI' | 'NO'
  frecuencia?: string
  descripcion?: string
  estado?: string
}

export interface CreateVaccineInput {
  id_veterinaria: number
  id_mascota: number
  nombre_vacuna: string
  fecha?: string
  dosis?: string | null
  requiere_refuerzo?: string | null
  frecuencia?: string | null
  descripcion?: string | null
  estado?: string | null
}

export const vaccinesService = {
  /**
   * Registra un lote de vacunas aplicadas para una mascota
   */
  async createVaccineBatch(
    records: CreateVaccineInput[]
  ): Promise<HistorialVacunas[]> {
    if (!records || records.length === 0) return []

    const formattedRecords = records.map((rec) => ({
      id_veterinaria: rec.id_veterinaria,
      id_mascota: rec.id_mascota,
      nombre_vacuna: rec.nombre_vacuna.trim().toUpperCase(),
      fecha: rec.fecha || new Date().toISOString(),
      dosis: rec.dosis || null,
      requiere_refuerzo: rec.requiere_refuerzo || 'NO',
      frecuencia: rec.requiere_refuerzo === 'SI' ? rec.frecuencia?.trim() || null : null,
      descripcion: rec.descripcion || null,
      estado: rec.estado || 'APLICADA',
      created_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('historial_vacunas')
      .insert(formattedRecords as any)
      .select()

    if (error) {
      console.error('Error al registrar historial de vacunas:', error)
      throw new Error(`Error al registrar vacunas: ${error.message}`)
    }

    return (data as unknown as HistorialVacunas[]) || []
  },

  /**
   * Obtiene el historial de vacunas aplicadas a una mascota
   */
  async getVaccinesByPatient(idMascota: number, idVeterinaria: number): Promise<HistorialVacunas[]> {
    const { data, error } = await supabase
      .from('historial_vacunas')
      .select('*')
      .eq('id_veterinaria', idVeterinaria)
      .eq('id_mascota', idMascota)
      .order('fecha', { ascending: false })

    if (error) {
      console.error('Error al obtener vacunas del paciente:', error)
      throw error
    }

    return (data as unknown as HistorialVacunas[]) || []
  },
}
