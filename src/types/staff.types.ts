export type RolBase = 'PRO' | 'MED' | 'ADM'
export type EstadoStaff = 'VIG' | 'BAJ' | 'ACTIVO'
export type TipoBloqueoAgenda = 'DESCANSO' | 'VACACION' | 'CIRUGIA' | 'FERIADO' | 'EMERGENCIA'

export interface PersonaStaff {
  id_persona: number
  id_veterinaria: number
  nombres: string
  apellidos: string
  email: string
  telefono?: string | null
  rol: RolBase
  estado: EstadoStaff
  user_id?: string | null
  foto_url?: string | null
  created_at?: string
  rol_info?: {
    id_rol: number
    nombre: string
  }
}

export interface RegisterStaffDTO {
  nombres: string
  apellidos: string
  email: string
  password: string
  telefono?: string
  rol: 'MED' | 'ADM'
  id_rol?: number
}

export interface UpdateStaffDTO {
  id_persona: number
  id_veterinaria: number
  nombres: string
  apellidos: string
  email: string
  telefono?: string
  rol: 'MED' | 'ADM'
  id_rol?: number
  foto_file?: File | Blob
}

export interface HorarioPersonal {
  id_horario?: number
  id_persona: number
  dia_semana: number // 1 = Lunes, 7 = Domingo
  hora_inicio: string // Formato 'HH:mm:ss' o 'HH:mm'
  hora_fin: string // Formato 'HH:mm:ss' o 'HH:mm'
  activo: boolean
  created_at?: string
}

export interface BloqueoAgenda {
  id_bloqueo?: number
  id_veterinaria: number
  id_persona?: number | null // null si bloquea toda la clínica
  fecha_inicio: string // ISO 8601 string
  fecha_fin: string // ISO 8601 string
  tipo_bloqueo: TipoBloqueoAgenda
  motivo?: string
  created_at?: string
}

export interface RolRBAC {
  id_rol: number
  id_veterinaria: number
  nombre: string
  descripcion?: string | null
  activo: boolean
  es_sistema: boolean
  cant_permisos?: number
  cant_usuarios?: number
  cantPermisos: number
  cantUsuarios: number
  fecha_crea?: string | null
}

export interface PermisoRBAC {
  id_permiso: number
  codigo: string
  nombre: string
  descripcion?: string | null
  modulo: string
}

export type Rol = RolRBAC
export type Permiso = PermisoRBAC
