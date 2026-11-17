import type { PermisoCodigo, RolCodigo, UserRole } from '@/types/auth.types'
import type { PermisoRBAC } from '@/types/staff.types'

/**
 * Roles de Sistema auto-aprovisionados por trigger en cada clínica
 */
export const SYSTEM_ROLES: RolCodigo[] = [
  'ADMINISTRADOR',
  'SUPERVISOR',
  'VETERINARIO',
  'ASISTENTE',
  'RECEPCION',
  'CLIENTE',
]

/**
 * Catálogo Maestro de Permisos (Sección 2.1 — Especificación RBAC Multi-Tenant)
 * Sirve como respaldo local si aún no se ha ejecutado el seed en base de datos.
 */
export const MASTER_PERMISOS_CATALOG: PermisoRBAC[] = [
  // Clientes
  { id_permiso: 1, codigo: 'VER_CLIENTES', nombre: 'Ver clientes', descripcion: 'Consultar directorio y fichas de propietarios', modulo: 'Clientes' },
  { id_permiso: 2, codigo: 'CREAR_CLIENTES', nombre: 'Crear clientes', descripcion: 'Registrar nuevos propietarios en la clínica', modulo: 'Clientes' },
  { id_permiso: 3, codigo: 'EDITAR_CLIENTES', nombre: 'Editar clientes', descripcion: 'Actualizar datos de contacto de propietarios', modulo: 'Clientes' },
  { id_permiso: 4, codigo: 'ELIMINAR_CLIENTES', nombre: 'Eliminar clientes', descripcion: 'Dar de baja o eliminar registros de clientes', modulo: 'Clientes' },
  // Mascotas
  { id_permiso: 5, codigo: 'VER_MASCOTAS', nombre: 'Ver mascotas', descripcion: 'Consultar listado y perfil clínico de pacientes', modulo: 'Mascotas' },
  { id_permiso: 6, codigo: 'CREAR_MASCOTAS', nombre: 'Crear mascotas', descripcion: 'Dar de alta nuevos pacientes en el sistema', modulo: 'Mascotas' },
  { id_permiso: 7, codigo: 'EDITAR_MASCOTAS', nombre: 'Editar mascotas', descripcion: 'Modificar datos biométricos y alertas de mascotas', modulo: 'Mascotas' },
  { id_permiso: 8, codigo: 'ELIMINAR_MASCOTAS', nombre: 'Eliminar mascotas', descripcion: 'Dar de baja o eliminar registros de pacientes', modulo: 'Mascotas' },
  // Citas
  { id_permiso: 9, codigo: 'VER_CITAS', nombre: 'Ver citas', descripcion: 'Visualizar el calendario, agenda médica y bloqueos', modulo: 'Citas' },
  { id_permiso: 10, codigo: 'CREAR_CITAS', nombre: 'Crear citas', descripcion: 'Programar nuevas citas y turnos de atención', modulo: 'Citas' },
  { id_permiso: 11, codigo: 'EDITAR_CITAS', nombre: 'Editar citas', descripcion: 'Reprogramar horarios y estados de citas', modulo: 'Citas' },
  { id_permiso: 12, codigo: 'CANCELAR_CITAS', nombre: 'Cancelar citas', descripcion: 'Anular citas agendadas con registro de motivo', modulo: 'Citas' },
  // Historia Clínica
  { id_permiso: 13, codigo: 'VER_HISTORIA_CLINICA', nombre: 'Ver historia clínica', descripcion: 'Lectura de historial clínico, hospitalizaciones y cirugías', modulo: 'Historia Clínica' },
  { id_permiso: 14, codigo: 'CREAR_CONSULTA', nombre: 'Crear consulta clínica', descripcion: 'Registrar nuevas consultas SOAP, internaciones y cirugías', modulo: 'Historia Clínica' },
  { id_permiso: 15, codigo: 'EDITAR_CONSULTA', nombre: 'Editar consulta clínica', descripcion: 'Actualizar evoluciones, signos vitales y diagnósticos', modulo: 'Historia Clínica' },
  // Vacunas
  { id_permiso: 16, codigo: 'VER_RECETAS', nombre: 'Ver recetas', descripcion: 'Consultar carnet de vacunación y recetas emitidas', modulo: 'Vacunas' },
  { id_permiso: 17, codigo: 'CREAR_RECETAS', nombre: 'Crear recetas', descripcion: 'Prescribir medicamentos y registrar dosis de vacunas', modulo: 'Vacunas' },
  // Configuración
  { id_permiso: 18, codigo: 'VER_INVENTARIO', nombre: 'Ver servicios y precios', descripcion: 'Consultar el catálogo de servicios médicos y aranceles', modulo: 'Configuración' },
  { id_permiso: 19, codigo: 'EDITAR_INVENTARIO', nombre: 'Editar servicios y precios', descripcion: 'Crear y actualizar precios y duración de servicios', modulo: 'Configuración' },
  { id_permiso: 20, codigo: 'CONFIGURACION_GENERAL', nombre: 'Configuración general', descripcion: 'Modificar datos comerciales y ajustes de la clínica', modulo: 'Configuración' },
  // Reportes
  { id_permiso: 21, codigo: 'VER_REPORTES', nombre: 'Ver reportes', descripcion: 'Acceder a métricas operativas e indicadores de gestión', modulo: 'Reportes' },
  // Publicaciones
  { id_permiso: 22, codigo: 'VER_PUBLICACIONES', nombre: 'Ver tablón de anuncios', descripcion: 'Visualizar campañas, avisos y noticias de la clínica', modulo: 'Publicaciones' },
  { id_permiso: 23, codigo: 'ADMINISTRAR_PUBLICACIONES', nombre: 'Administrar anuncios', descripcion: 'Crear, publicar y eliminar anuncios y notificaciones push', modulo: 'Publicaciones' },
  // Usuarios
  { id_permiso: 24, codigo: 'ADMINISTRAR_USUARIOS', nombre: 'Administrar personal', descripcion: 'Gestionar médicos, administrativos, turnos y credenciales', modulo: 'Usuarios' },
  // Roles
  { id_permiso: 25, codigo: 'ADMINISTRAR_ROLES', nombre: 'Administrar roles y accesos', descripcion: 'Crear roles personalizados y configurar matriz de permisos RBAC', modulo: 'Roles' },
]

/**
 * Servicio Evaluador en Memoria en O(1) (Equivalente a PermissionService en Flutter)
 */
export class PermissionService {
  private readonly permisos: Set<string>
  public readonly rol: string

  constructor(rol: string = '', permisosCodigos: (PermisoCodigo | string)[] = []) {
    this.rol = (rol || '').trim().toUpperCase()
    this.permisos = new Set(permisosCodigos.map((c) => c.trim().toUpperCase()))
  }

  /**
   * Regla 1 (Superusuario Incondicional):
   * Si rol === 'ADMINISTRADOR', retorna true incondicionalmente para todos los permisos de clínica.
   */
  hasPermission(codigo: PermisoCodigo | string): boolean {
    const cleanCode = codigo.trim().toUpperCase()

    if (this.rol === 'SUPERADMIN') {
      return true
    }

    if (cleanCode === 'TENANT_MANAGEMENT') {
      return this.permisos.has('TENANT_MANAGEMENT')
    }

    if (this.rol === 'ADMINISTRADOR' || this.rol === 'PRO') {
      return true
    }

    if (this.permisos.has(cleanCode)) {
      return true
    }

    // Equivalencia con rutas web de hospitalización y cirugía gobernadas por Historia Clínica en BD
    if (
      (cleanCode === 'HOSPITALIZACION_OP' || cleanCode === 'CIRUGIA_OP') &&
      this.permisos.has('VER_HISTORIA_CLINICA')
    ) {
      return true
    }

    return false
  }

  hasAnyPermission(codigos: (PermisoCodigo | string)[]): boolean {
    if (this.rol === 'SUPERADMIN' || this.rol === 'ADMINISTRADOR' || this.rol === 'PRO') {
      if (codigos.length === 1 && codigos[0] === 'TENANT_MANAGEMENT') {
        return this.rol === 'SUPERADMIN' || this.permisos.has('TENANT_MANAGEMENT')
      }
      return true
    }
    return codigos.some((c) => this.hasPermission(c))
  }

  hasAllPermissions(codigos: (PermisoCodigo | string)[]): boolean {
    return codigos.every((c) => this.hasPermission(c))
  }

  canView(modulo: string): boolean {
    return this.hasPermission(`VER_${modulo.trim().toUpperCase()}`)
  }

  canCreate(modulo: string): boolean {
    return this.hasPermission(`CREAR_${modulo.trim().toUpperCase()}`)
  }

  canEdit(modulo: string): boolean {
    return this.hasPermission(`EDITAR_${modulo.trim().toUpperCase()}`)
  }

  canDelete(modulo: string): boolean {
    const mod = modulo.trim().toUpperCase()
    return this.hasPermission(`ELIMINAR_${mod}`) || this.hasPermission(`CANCELAR_${mod}`)
  }

  toArray(): PermisoCodigo[] {
    return Array.from(this.permisos) as PermisoCodigo[]
  }
}

/**
 * Sincroniza el atributo corto personal.rol ('MED' | 'ADM' | 'PRO') según el nombre del rol RBAC
 * (Sección 1.1 y 4.3 Checklist #1 de la especificación)
 */
export function syncStaffBaseRole(rbacRoleName: string | undefined | null, currentRol?: string): 'PRO' | 'MED' | 'ADM' {
  if (currentRol === 'PRO') return 'PRO'
  if (!rbacRoleName) return currentRol === 'MED' ? 'MED' : 'ADM'
  const norm = rbacRoleName.trim().toUpperCase()
  return norm === 'VETERINARIO' || norm === 'MED' ? 'MED' : 'ADM'
}

/**
 * Mapea códigos de rol de la base de datos a UserRole frontend
 */
export function mapDatabaseRoleToUserRole(dbRole: string | null | undefined): UserRole {
  if (!dbRole) return 'veterinarian'
  const normalized = dbRole.toUpperCase().trim()

  if (normalized === 'SUPERADMIN' || normalized === 'SUPER_ADMIN') return 'superadmin'
  if (
    normalized === 'PRO' ||
    normalized === 'PROPIETARIO' ||
    normalized === 'ADMINISTRADOR' ||
    normalized === 'ADMIN' ||
    normalized === 'CLINIC_ADMIN' ||
    normalized === 'DIRECTOR' ||
    normalized === 'GERENTE' ||
    normalized === 'SUPERVISOR'
  ) {
    return 'clinic_admin'
  }
  if (
    normalized === 'MED' ||
    normalized === 'MEDICO' ||
    normalized === 'VETERINARIO' ||
    normalized === 'VETERINARIAN'
  ) {
    return 'veterinarian'
  }
  if (
    normalized === 'ASI' ||
    normalized === 'ASISTENTE' ||
    normalized === 'ASSISTANT' ||
    normalized === 'AUXILIAR'
  ) {
    return 'assistant'
  }
  if (
    normalized === 'REC' ||
    normalized === 'RECEPCION' ||
    normalized === 'RECEPCIONISTA' ||
    normalized === 'RECEPTIONIST' ||
    normalized === 'SECRETARIA' ||
    normalized === 'ADM'
  ) {
    return 'receptionist'
  }
  if (
    normalized === 'CLIENTE' ||
    normalized === 'CLIENT' ||
    normalized === 'DUEÑO'
  ) {
    return 'client'
  }

  return 'veterinarian'
}

/**
 * Matriz de Permisos por Defecto para cada Rol de Sistema (Sección 2.1 de Especificación RBAC)
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, PermisoCodigo[]> = {
  SUPERADMIN: [
    'TENANT_MANAGEMENT',
    'VER_CLIENTES',
    'VER_MASCOTAS',
    'VER_CITAS',
    'VER_REPORTES',
    'VER_PUBLICACIONES',
  ],
  ADMINISTRADOR: [
    'VER_CLIENTES',
    'CREAR_CLIENTES',
    'EDITAR_CLIENTES',
    'ELIMINAR_CLIENTES',
    'VER_MASCOTAS',
    'CREAR_MASCOTAS',
    'EDITAR_MASCOTAS',
    'ELIMINAR_MASCOTAS',
    'VER_CITAS',
    'CREAR_CITAS',
    'EDITAR_CITAS',
    'CANCELAR_CITAS',
    'VER_HISTORIA_CLINICA',
    'CREAR_CONSULTA',
    'EDITAR_CONSULTA',
    'VER_RECETAS',
    'CREAR_RECETAS',
    'HOSPITALIZACION_OP',
    'CIRUGIA_OP',
    'VER_INVENTARIO',
    'EDITAR_INVENTARIO',
    'CONFIGURACION_GENERAL',
    'VER_REPORTES',
    'VER_PUBLICACIONES',
    'ADMINISTRAR_PUBLICACIONES',
    'ADMINISTRAR_USUARIOS',
    'ADMINISTRAR_ROLES',
  ],
  SUPERVISOR: [
    'VER_CLIENTES',
    'CREAR_CLIENTES',
    'EDITAR_CLIENTES',
    'VER_MASCOTAS',
    'CREAR_MASCOTAS',
    'EDITAR_MASCOTAS',
    'VER_CITAS',
    'CREAR_CITAS',
    'EDITAR_CITAS',
    'CANCELAR_CITAS',
    'VER_HISTORIA_CLINICA',
    'VER_RECETAS',
    'HOSPITALIZACION_OP',
    'CIRUGIA_OP',
    'VER_INVENTARIO',
    'CONFIGURACION_GENERAL',
    'VER_REPORTES',
    'VER_PUBLICACIONES',
    'ADMINISTRAR_PUBLICACIONES',
  ],
  VETERINARIO: [
    'VER_CLIENTES',
    'VER_MASCOTAS',
    'VER_CITAS',
    'VER_HISTORIA_CLINICA',
    'CREAR_CONSULTA',
    'EDITAR_CONSULTA',
    'VER_RECETAS',
    'CREAR_RECETAS',
    'HOSPITALIZACION_OP',
    'CIRUGIA_OP',
    'VER_PUBLICACIONES',
  ],
  ASISTENTE: [
    'VER_CLIENTES',
    'VER_MASCOTAS',
    'VER_CITAS',
    'VER_HISTORIA_CLINICA',
    'VER_RECETAS',
    'HOSPITALIZACION_OP',
    'CIRUGIA_OP',
    'VER_PUBLICACIONES',
  ],
  RECEPCION: [
    'VER_CLIENTES',
    'CREAR_CLIENTES',
    'EDITAR_CLIENTES',
    'VER_MASCOTAS',
    'CREAR_MASCOTAS',
    'EDITAR_MASCOTAS',
    'VER_CITAS',
    'CREAR_CITAS',
    'EDITAR_CITAS',
    'CANCELAR_CITAS',
    'VER_PUBLICACIONES',
  ],
  CLIENTE: [
    'VER_MASCOTAS',
    'VER_CITAS',
    'VER_PUBLICACIONES',
  ],
  // Alias para UserRole del frontend
  clinic_admin: [
    'VER_CLIENTES',
    'CREAR_CLIENTES',
    'EDITAR_CLIENTES',
    'ELIMINAR_CLIENTES',
    'VER_MASCOTAS',
    'CREAR_MASCOTAS',
    'EDITAR_MASCOTAS',
    'ELIMINAR_MASCOTAS',
    'VER_CITAS',
    'CREAR_CITAS',
    'EDITAR_CITAS',
    'CANCELAR_CITAS',
    'VER_HISTORIA_CLINICA',
    'CREAR_CONSULTA',
    'EDITAR_CONSULTA',
    'VER_RECETAS',
    'CREAR_RECETAS',
    'HOSPITALIZACION_OP',
    'CIRUGIA_OP',
    'VER_INVENTARIO',
    'EDITAR_INVENTARIO',
    'CONFIGURACION_GENERAL',
    'VER_REPORTES',
    'VER_PUBLICACIONES',
    'ADMINISTRAR_PUBLICACIONES',
    'ADMINISTRAR_USUARIOS',
    'ADMINISTRAR_ROLES',
  ],
  veterinarian: [
    'VER_CLIENTES',
    'VER_MASCOTAS',
    'VER_CITAS',
    'VER_HISTORIA_CLINICA',
    'CREAR_CONSULTA',
    'EDITAR_CONSULTA',
    'VER_RECETAS',
    'CREAR_RECETAS',
    'HOSPITALIZACION_OP',
    'CIRUGIA_OP',
    'VER_PUBLICACIONES',
  ],
  assistant: [
    'VER_CLIENTES',
    'VER_MASCOTAS',
    'VER_CITAS',
    'VER_HISTORIA_CLINICA',
    'VER_RECETAS',
    'HOSPITALIZACION_OP',
    'CIRUGIA_OP',
    'VER_PUBLICACIONES',
  ],
  receptionist: [
    'VER_CLIENTES',
    'CREAR_CLIENTES',
    'EDITAR_CLIENTES',
    'VER_MASCOTAS',
    'CREAR_MASCOTAS',
    'EDITAR_MASCOTAS',
    'VER_CITAS',
    'CREAR_CITAS',
    'EDITAR_CITAS',
    'CANCELAR_CITAS',
    'VER_PUBLICACIONES',
  ],
  client: [
    'VER_MASCOTAS',
    'VER_CITAS',
    'VER_PUBLICACIONES',
  ],
}

export function getDefaultPermissionsForRole(roleOrCode: string): PermisoCodigo[] {
  const norm = (roleOrCode || '').trim().toUpperCase()
  if (ROLE_DEFAULT_PERMISSIONS[norm]) {
    return ROLE_DEFAULT_PERMISSIONS[norm]
  }
  if (ROLE_DEFAULT_PERMISSIONS[roleOrCode]) {
    return ROLE_DEFAULT_PERMISSIONS[roleOrCode]
  }
  const mapped = mapDatabaseRoleToUserRole(roleOrCode)
  return ROLE_DEFAULT_PERMISSIONS[mapped] || []
}

/**
 * Getter inyectado para useAuthStore para evitar dependencias circulares
 */
let authStoreGetter: (() => any) | null = null

export function setAuthStoreGetter(getter: () => any) {
  authStoreGetter = getter
}

/**
 * Aserto de seguridad defensivo en servicios / mutaciones.
 * Si el usuario activo no posee el permiso requerido, lanza una excepción que
 * cancela la mutación inmediatamente.
 */
export function assertPermission(permission: PermisoCodigo | string, actionDescription?: string): void {
  if (!authStoreGetter) return
  const user = authStoreGetter()?.user
  if (!user) return

  const effectiveRole =
    user.role === 'superadmin' || user.rol_codigo === 'SUPERADMIN'
      ? 'SUPERADMIN'
      : user.rol_codigo || (user.role === 'clinic_admin' ? 'ADMINISTRADOR' : user.role.toUpperCase())

  const service = new PermissionService(effectiveRole, user.permisos || [])
  if (!service.hasPermission(permission)) {
    const cleanPermission = permission.trim().toUpperCase()
    const msg = actionDescription
      ? `Acceso denegado: No tienes permiso para ${actionDescription} (${cleanPermission}).`
      : `Acceso denegado: Se requiere el permiso ${cleanPermission}.`
    throw new Error(msg)
  }
}
