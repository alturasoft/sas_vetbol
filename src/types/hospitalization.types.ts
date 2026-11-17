import type { Hospitalizaciones, HistoriaEvolucionHospitalizacion, Cirugias } from './database.types'

export type { Hospitalizaciones, HistoriaEvolucionHospitalizacion, Cirugias }

export type EstadoHospitalizacion = 'INGRESADO' | 'EN_TRATAMIENTO' | 'OBSERVACION' | 'ALTA' | 'FALLECIDO' | string
export type EstadoCirugia = 'PROGRAMADA' | 'EN_QUIROFANO' | 'FINALIZADA' | 'CANCELADA' | string

export interface HospitalizacionConDetalles extends Hospitalizaciones {
  mascota_nombre?: string
  mascota_especie?: string
  propietario_nombre?: string
  propietario_telefono?: string
  evoluciones?: HistoriaEvolucionHospitalizacion[]
}

export interface CirugiaConDetalles extends Cirugias {
  mascota_nombre?: string
  propietario_nombre?: string
}
