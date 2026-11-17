import { z } from 'zod'

export type EstadoCirugia = 'PROGRAMADA' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA'

export interface Cirugia {
  id_cirugia: number
  id_veterinaria: number
  id_mascota: number
  id_historia_clinica?: number | null
  fecha_cirugia: string // ISO String
  procedimiento: string
  cirujano: string
  anestesia?: string | null
  estado: EstadoCirugia
  observaciones?: string | null
  created_at?: string
  updated_at?: string
  mascota?: {
    id_mascota: number
    nombre: string
    especie: string
    raza?: string | null
    foto_url?: string | null
    estado: string
    cliente?: {
      id_cliente: number
      nombres: string
      apellidos?: string | null
      telefono?: string | null
    } | null
  } | null
}

export const nuevaCirugiaSchema = z.object({
  id_mascota: z.number({ message: 'Debe seleccionar una mascota' }),
  fecha_cirugia: z.string().min(1, 'Fecha y hora requerida'),
  procedimiento: z.string().min(3, 'El procedimiento es obligatorio'),
  cirujano: z.string().min(3, 'El cirujano responsable es obligatorio'),
  anestesia: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
})

export const finalizarCirugiaSchema = z.object({
  hallazgos: z.string().min(5, 'Describa los hallazgos y técnica operatoria'),
  complicaciones: z.string().optional().nullable(),
})

export type NuevaCirugiaInput = z.infer<typeof nuevaCirugiaSchema>
export type FinalizarCirugiaInput = z.infer<typeof finalizarCirugiaSchema>
