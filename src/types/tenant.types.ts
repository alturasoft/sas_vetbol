import type { Veterinarias, Suscripciones, Departamentos, EstadoSuscripcion, TipoTemporalidad } from './database.types'

export type { Veterinarias, Suscripciones, Departamentos, EstadoSuscripcion, TipoTemporalidad }

export type TenantStatus = EstadoSuscripcion

export interface Tenant {
  id: string
  id_veterinaria?: number
  name: string

  slug: string
  legal_name?: string | null
  tax_id?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  logo_url?: string | null
  status: TenantStatus
  created_at: string
  updated_at: string
  suscripcion?: Suscripciones | null
}

