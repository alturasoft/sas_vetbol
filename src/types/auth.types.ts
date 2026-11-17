import type { PermisoCodigo, RolCodigo } from './database.types'

export type { PermisoCodigo, RolCodigo }

export type UserRole = 
  | 'superadmin' 
  | 'clinic_admin' 
  | 'veterinarian' 
  | 'receptionist'
  | 'assistant'
  | 'client'

export interface UserProfile {
  id: string // UUID de auth.users
  id_persona?: number
  id_veterinaria?: number
  veterinaria_nombre?: string
  rol_codigo?: RolCodigo | string
  permisos?: PermisoCodigo[]
  nombres?: string
  apellidos?: string
  nombre_completo?: string
  email: string
  telefono?: string | null
  phone?: string | null
  matricula_profesional?: string | null
  license_number?: string | null
  foto_url?: string | null
  avatar_url?: string | null
  estado?: string // 'VIG', 'BAJ'
  created_at?: string
  updated_at?: string

  // Propiedades de conveniencia y compatibilidad
  role: UserRole
  tenant_id: string | null
  full_name: string
  is_active: boolean
}


export interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
}

