import type { Clientes, Mascotas } from './database.types'

export type { Clientes, Mascotas }

export type Species = 'canine' | 'feline' | 'bird' | 'rodent' | 'reptile' | 'equine' | 'exotic' | 'other'
export type Gender = 'male' | 'female' | 'unknown'

export interface Owner {
  id: string
  id_cliente?: number
  id_veterinaria?: number
  tenant_id: string
  first_name: string
  last_name: string
  document_id?: string | null
  email?: string | null
  phone: string
  alternate_phone?: string | null
  address?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  id_mascota?: number
  id_veterinaria?: number
  id_cliente?: number
  tenant_id: string
  owner_id: string
  name: string

  species: Species | string
  breed?: string | null
  gender?: Gender | string | null
  is_neutered: boolean
  birth_date?: string | null
  microchip?: string | null
  color?: string | null
  weight_kg?: number | null
  allergies?: string | null
  notes?: string | null
  avatar_url?: string | null
  is_alive: boolean
  created_at: string
  updated_at: string
  owner?: Owner
  cliente?: Clientes
}

export interface MascotaConCliente extends Mascotas {
  cliente?: Clientes | null
}

