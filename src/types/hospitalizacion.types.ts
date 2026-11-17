import { z } from 'zod'

export type EstadoHospitalizacion = 'INTERNADO' | 'ALTA' | 'DECESO'

export interface Hospitalizacion {
  id_hospitalizacion: number
  id_veterinaria: number
  id_mascota: number
  id_historia_clinica?: number | null
  fecha_ingreso: string // ISO String
  fecha_alta?: string | null
  motivo_ingreso: string
  habitacion?: string | null // Nombre de Jaula / Canil / Habitación (ej: "Canil 05", "Jaula UCI-1")
  estado: EstadoHospitalizacion
  observaciones?: string | null
  created_at?: string
  updated_at?: string
  // Joins para vista SaaS
  mascota?: {
    id_mascota: number
    nombre: string
    especie: string
    raza?: string | null
    foto_url?: string | null
    estado: string
    peso?: number | null
    cliente?: {
      id_cliente: number
      nombres: string
      apellidos: string
      telefono?: string | null
    } | null
  } | null
}

export interface EvolucionHospitalizacion {
  id_evolucion: number
  id_hospitalizacion: number
  fecha_evolucion: string
  nota: string
  id_personal?: number | null
  temperatura?: string | null
  peso?: string | null
  frecuencia_cardiaca?: string | null
  frecuencia_respiratoria?: string | null
  tratamiento?: string | null
  created_at?: string
  personal?: {
    nombres: string
    apellidos: string
  } | null
}

export const nuevaHospitalizacionSchema = z.object({
  id_mascota: z.number({ message: 'Debe seleccionar una mascota' }),
  fecha_ingreso: z.string().min(1, 'Fecha de ingreso requerida'),
  motivo_ingreso: z.string().min(3, 'El motivo de ingreso es obligatorio'),
  habitacion: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
})

export const nuevaEvolucionSchema = z.object({
  id_hospitalizacion: z.number(),
  nota: z.string().min(2, 'La nota clínica es obligatoria'),
  temperatura: z.string().optional().nullable(),
  peso: z.string().optional().nullable(),
  frecuencia_cardiaca: z.string().optional().nullable(),
  frecuencia_respiratoria: z.string().optional().nullable(),
  tratamiento: z.string().optional().nullable(),
})

export const darAltaSchema = z.object({
  observaciones_alta: z.string().min(3, 'Ingrese las indicaciones de alta médica'),
})

export type NuevaHospitalizacionInput = z.infer<typeof nuevaHospitalizacionSchema>
export type NuevaEvolucionInput = z.infer<typeof nuevaEvolucionSchema>
export type DarAltaInput = z.infer<typeof darAltaSchema>
