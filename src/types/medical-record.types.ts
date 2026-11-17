import type {
  HistoriasClinicas,
  HistoriaSignosVitales,
  HistoriaDiagnosticos,
  HistoriaRecetas,
  HistoriaTratamientos,
  HistoriaExamenes,
  HistoriaArchivos,
  HistorialVacunas,
  VwTimelineClinico,
  Mascotas,
  Clientes,
  Personal
} from './database.types'

export type {
  HistoriasClinicas,
  HistoriaSignosVitales,
  HistoriaDiagnosticos,
  HistoriaRecetas,
  HistoriaTratamientos,
  HistoriaExamenes,
  HistoriaArchivos,
  HistorialVacunas,
  VwTimelineClinico
}

export type TipoConsulta = 'Consulta General' | 'Urgencia' | 'Control' | 'Cirugía' | 'Especialidad' | string
export type EstadoConsulta = 'ABIERTA' | 'CERRADA' | 'ANULADA'
export type GravedadDiagnostico = 'LEVE' | 'MODERADO' | 'GRAVE' | 'CRÍTICO'
export type TipoDiagnostico = 'PRESUNTIVO' | 'DEFINITIVO'
export type EstadoTratamiento = 'ACTIVO' | 'COMPLETADO' | 'SUSPENDIDO'
export type TipoArchivoClinico = 'FOTO' | 'RADIOGRAFIA' | 'DOCUMENTO' | string

export type ClinicalAlertLevel = 'NORMAL' | 'ALERT' | 'CRITICAL'

export interface ClinicalRangeEvaluation {
  level: ClinicalAlertLevel
  message: string
  color: 'emerald' | 'amber' | 'rose'
}

export interface ConsultaDetallada extends HistoriasClinicas {
  mascota?: Mascotas & { cliente?: Clientes }
  cliente?: Clientes
  personal?: Personal | null
  signos_vitales?: HistoriaSignosVitales | null
  diagnosticos?: HistoriaDiagnosticos[]
  tratamientos?: HistoriaTratamientos[]
  recetas?: HistoriaRecetas[]
  examenes?: HistoriaExamenes[]
  archivos?: HistoriaArchivos[]
}

export interface CreateHistoriaCabeceraInput {
  id_veterinaria: number
  id_mascota: number
  id_cliente: number
  id_personal?: number | null
  numero_historia?: string
  fecha_consulta?: string
  tipo_consulta: string
  motivo_consulta: string
  anamnesis: string
  estado_general?: string
  observaciones?: string | null
  estado?: string
}

export interface UpdateHistoriaCabeceraInput {
  tipo_consulta?: string
  motivo_consulta?: string
  anamnesis?: string
  estado_general?: string
  observaciones?: string | null
  estado?: string
}

export interface UpsertSignosVitalesInput {
  id_historia_clinica: number
  peso?: number | null
  temperatura?: number | null
  frecuencia_cardiaca?: number | null
  frecuencia_respiratoria?: number | null
  presion_arterial?: string | null
  hidratacion?: string | null
  mucosas?: string | null
  condicion_corporal?: string | null
  observaciones?: string | null
  [key: string]: unknown
}

export interface CreateDiagnosticoInput {
  id_historia_clinica: number
  tipo_diagnostico?: string
  diagnostico: string
  gravedad?: string
  codigo_cie_vet?: string | null
  observaciones?: string | null
}

export interface CreateTratamientoInput {
  id_historia_clinica: number
  tratamiento: string
  indicaciones?: string | null
  duracion_dias?: number | null
  estado?: string
}

export interface CreateRecetaInput {
  id_historia_clinica: number
  medicamento: string
  dosis?: string | null
  frecuencia?: string | null
  via_administracion?: string | null
  duracion?: string | null
  instrucciones?: string | null
}

export interface CreateExamenInput {
  id_historia_clinica: number
  tipo_examen: string
  resultado?: string | null
  archivo_resultado?: string | null
  fecha_examen?: string | null
  laboratorio?: string | null
  observaciones?: string | null
}

export interface CreateArchivoClinicoInput {
  id_historia_clinica: number
  tipo_archivo?: string
  nombre_archivo?: string | null
  url_archivo: string
  extension?: string | null
  tamano_kb?: number | null
  observaciones?: string | null
}

export interface MedicalRecord {
  id: string
  id_historia_clinica?: number
  id_veterinaria?: number
  tenant_id: string

  patient_id: string
  veterinarian_id: string
  appointment_id?: string | null
  consultation_date: string
  weight_kg?: number | null
  temperature_celsius?: number | null
  heart_rate_bpm?: number | null
  respiratory_rate_bpm?: number | null
  anamnesis?: string | null
  subjective?: string | null // S (Subjetivo)
  objective?: string | null  // O (Objetivo)
  assessment?: string | null // A (Evaluación / Diagnóstico)
  plan?: string | null       // P (Plan de tratamiento)
  follow_up_date?: string | null
  created_at: string
  updated_at: string
  patient_name?: string
  veterinarian_name?: string

  // Datos extendidos de la consulta
  signos_vitales?: HistoriaSignosVitales | null
  diagnosticos?: HistoriaDiagnosticos[]
  recetas?: HistoriaRecetas[]
  tratamientos?: HistoriaTratamientos[]
  examenes?: HistoriaExamenes[]
  archivos?: HistoriaArchivos[]
}


