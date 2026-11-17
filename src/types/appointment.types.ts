import type { Citas, Servicios, BloqueosAgenda, CitasHistorial, VwAgendaGeneral } from './database.types'

export type { Citas, Servicios, BloqueosAgenda, CitasHistorial, VwAgendaGeneral }

export type AppointmentStatus =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type CalendarViewMode = 'day' | 'week' | 'month'

export interface RealAppointmentItem {
  id: number
  id_cita: number
  id_veterinaria: number
  id_mascota?: number | null
  id_cliente?: number | null
  id_persona?: number | null
  id_servicio?: number | null

  title: string
  patient_name: string
  patient_species?: string
  patient_breed?: string
  owner_name: string
  owner_phone?: string
  owner_email?: string
  veterinarian_name: string
  start_time: string
  end_time: string
  status: AppointmentStatus | string
  reason: string
  notes?: string
}

export interface Appointment {
  id: string
  id_cita?: number
  id_veterinaria?: number
  tenant_id: string

  patient_id?: string | null
  owner_id?: string | null
  veterinarian_id?: string | null
  title: string
  reason?: string | null
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes?: string | null
  created_at: string
  updated_at: string
  patient_name?: string
  owner_name?: string
  veterinarian_name?: string
}

export interface CreateAppointmentDTO {
  idVeterinaria: number
  idCliente: number
  idMascota: number
  idPersona: number
  idServicio: number
  fechaInicio: Date
  duracionMinutos: number
  motivo?: string
  observaciones?: string
  origen?: 'WEB' | 'RECEPCION' | 'APP'
}

export interface TimeSlot {
  slot: Date
  label: string // ej. "09:00 AM"
  idPersona: number
  doctorName?: string
}

export interface DoctorOption {
  id_persona: number
  nombres: string
  apellidos: string
  rol?: string | null
  foto_url?: string | null
}

export interface NewAppointmentFormState {
  // Paso 1: Paciente
  selectedClient: {
    id_cliente: number
    nombres: string
    apellidos: string
    telefono?: string | null
    email?: string | null
    ci?: string | null
  } | null
  selectedPet: {
    id_mascota: number
    nombre: string
    especie: string
    raza?: string | null
    sexo?: string | null
    foto_url?: string | null
    estado: string
  } | null

  // Paso 2: Servicio
  selectedService: {
    id_servicio: number
    nombre: string
    descripcion?: string | null
    duracion_minutos: number
    precio?: number | null
    color?: string | null
  } | null

  // Paso 3: Médico
  isAutoDoctor: boolean
  selectedDoctorId: number | null // null si isAutoDoctor = true hasta que se elija slot
  selectedDoctorName?: string

  // Paso 4: Fecha y Hora
  selectedDate: Date
  selectedSlot: TimeSlot | null

  // Paso 5: Confirmación y notas
  motivo: string
  observaciones: string
}
