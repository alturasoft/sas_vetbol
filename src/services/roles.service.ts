import { supabase, supabasePublic } from '@/config/supabase'
import {
  MASTER_PERMISOS_CATALOG,
  PermissionService,
  syncStaffBaseRole,
  assertPermission,
} from '@/lib/permissions'
import { useAuthStore } from '@/stores/useAuthStore'
import type { PermisoRBAC, RolRBAC } from '@/types/staff.types'

/**
 * Parsea el conteo agregado devuelto por PostgREST: roles_permisos(count) / usuarios_roles(count)
 * (Equivalente exacto a parseCount en Rol.fromJson de Flutter)
 */
function parsePostgrestCount(field: unknown): number {
  if (!field) return 0
  if (Array.isArray(field) && field.length > 0) {
    const first = field[0]
    if (first && typeof first === 'object' && 'count' in first) {
      const parsed = Number((first as { count: unknown }).count)
      return isNaN(parsed) ? 0 : parsed
    }
    return field.length
  }
  if (typeof field === 'object' && field !== null && 'count' in field) {
    const parsed = Number((field as { count: unknown }).count)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

/**
 * Convierte una fila cruda de veterinarias.roles en la entidad tipada RolRBAC
 */
export function mapRowToRol(row: any): RolRBAC {
  const cantPermisos = parsePostgrestCount(row.roles_permisos)
  const cantUsuarios = parsePostgrestCount(row.usuarios_roles)

  return {
    id_rol: Number(row.id_rol),
    id_veterinaria: Number(row.id_veterinaria),
    nombre: String(row.nombre || '').trim().toUpperCase(),
    descripcion: row.descripcion ?? null,
    activo: row.activo ?? true,
    es_sistema: row.es_sistema ?? false,
    cant_permisos: cantPermisos,
    cant_usuarios: cantUsuarios,
    cantPermisos,
    cantUsuarios,
    fecha_crea: row.fecha_crea ?? null,
  }
}

export class RolesService {
  /**
   * 1. Carga unificada de sesión mediante RPC public.get_mis_permisos()
   */
  static async getMisPermisos(): Promise<{
    rol_nombre: string | null
    permisos_codigos: string[]
    service: PermissionService
  }> {
    try {
      const { data, error } = await supabasePublic.rpc('get_mis_permisos')
      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0] as any
        const rolNombre = row.rol_nombre ? String(row.rol_nombre).trim().toUpperCase() : null
        const codigos: string[] = Array.isArray(row.permisos_codigos)
          ? row.permisos_codigos.map((c: any) => String(c).trim().toUpperCase())
          : []
        return {
          rol_nombre: rolNombre,
          permisos_codigos: codigos,
          service: new PermissionService(rolNombre || '', codigos),
        }
      }
    } catch (err) {
      console.warn('Error al consultar RPC get_mis_permisos:', err)
    }

    const currentUser = useAuthStore.getState().user
    if (currentUser) {
      const fallbackRol = currentUser.rol_codigo || ''
      const fallbackPerms = currentUser.permisos || []
      return {
        rol_nombre: fallbackRol,
        permisos_codigos: fallbackPerms,
        service: new PermissionService(fallbackRol, fallbackPerms),
      }
    }

    return {
      rol_nombre: null,
      permisos_codigos: [],
      service: new PermissionService('', []),
    }
  }

  /**
   * 2. Obtiene el catálogo global de permisos agrupados por módulo (veterinarias.permisos)
   */
  static async getPermisos(): Promise<PermisoRBAC[]> {
    try {
      const { data, error } = await supabase
        .from('permisos')
        .select('*')
        .order('modulo', { ascending: true })
        .order('nombre', { ascending: true })

      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id_permiso: Number(p.id_permiso),
          codigo: String(p.codigo).trim().toUpperCase(),
          nombre: String(p.nombre),
          descripcion: p.descripcion ?? null,
          modulo: String(p.modulo),
        }))
      }
    } catch (err) {
      console.warn('Usando catálogo maestro local de permisos como respaldo:', err)
    }

    return [...MASTER_PERMISOS_CATALOG].sort((a, b) => {
      const modCmp = a.modulo.localeCompare(b.modulo)
      if (modCmp !== 0) return modCmp
      return a.nombre.localeCompare(b.nombre)
    })
  }

  /**
   * 3. Lista todos los roles de una clínica con conteos agregados de permisos y usuarios
   */
  static async getRolesByClinic(clinicId: number, onlyActive = false): Promise<RolRBAC[]> {
    if (!clinicId || clinicId <= 0) return []

    let query = supabase
      .from('roles')
      .select('*, roles_permisos(count), usuarios_roles(count)')
      .eq('id_veterinaria', clinicId)
      .order('es_sistema', { ascending: false })
      .order('nombre', { ascending: true })

    if (onlyActive) {
      query = query.eq('activo', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al listar roles de la clínica:', error)
      throw new Error(error.message || 'No se pudieron cargar los roles de la clínica.')
    }

    return (data || []).map(mapRowToRol)
  }

  /**
   * 4. Obtiene el detalle de un rol específico por su ID
   */
  static async getRolById(rolId: number): Promise<RolRBAC | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*, roles_permisos(count), usuarios_roles(count)')
      .eq('id_rol', rolId)
      .maybeSingle()

    if (error) {
      console.error('Error al obtener rol por ID:', error)
      throw new Error(error.message || 'No se pudo obtener la información del rol.')
    }

    if (!data) return null
    return mapRowToRol(data)
  }

  /**
   * 5. Obtiene la lista de permisos activos concedidos a un rol (veterinarias.roles_permisos)
   */
  static async getPermisosDelRol(rolId: number): Promise<PermisoRBAC[]> {
    const { data, error } = await supabase
      .from('roles_permisos')
      .select('id_permiso, permisos(*)')
      .eq('id_rol', rolId)

    if (error) {
      console.error('Error al obtener permisos del rol:', error)
      throw new Error(error.message || 'No se pudieron cargar los permisos asignados al rol.')
    }

    const result: PermisoRBAC[] = []
    for (const row of data || []) {
      const p = (row as any).permisos
      if (p && typeof p === 'object') {
        result.push({
          id_permiso: Number(p.id_permiso),
          codigo: String(p.codigo).trim().toUpperCase(),
          nombre: String(p.nombre),
          descripcion: p.descripcion ?? null,
          modulo: String(p.modulo),
        })
      }
    }

    return result
  }

  /**
   * 6. Crea un nuevo rol personalizado en la clínica (nace con activo: true, es_sistema: false)
   */
  static async createRol(
    payload: {
      id_veterinaria: number
      nombre: string
      descripcion?: string | null
    },
    permisoIds: number[] = []
  ): Promise<RolRBAC> {
    assertPermission('ADMINISTRAR_ROLES', 'crear nuevos roles')

    const normalizedName = payload.nombre.trim().toUpperCase()
    if (!normalizedName) {
      throw new Error('El nombre del rol es obligatorio.')
    }

    const { data: insertedRol, error: createError } = await supabase
      .from('roles')
      .insert({
        id_veterinaria: payload.id_veterinaria,
        nombre: normalizedName,
        descripcion: payload.descripcion?.trim() || null,
        activo: true,
        es_sistema: false,
      })
      .select('*')
      .single()

    if (createError) {
      if (createError.code === '23505') {
        throw new Error(`Ya existe un rol con el nombre "${normalizedName}" en esta clínica.`)
      }
      throw new Error(createError.message || 'No se pudo crear el rol personalizado.')
    }

    const newRolId = Number(insertedRol.id_rol)

    if (permisoIds.length > 0) {
      const rows = permisoIds.map((id_permiso) => ({
        id_rol: newRolId,
        id_permiso,
      }))
      const { error: permError } = await supabase.from('roles_permisos').insert(rows)
      if (permError) {
        console.error('Error al insertar permisos iniciales del rol:', permError)
      }
    }

    return {
      ...mapRowToRol(insertedRol),
      cant_permisos: permisoIds.length,
      cantPermisos: permisoIds.length,
    }
  }

  /**
   * 7. Activa o desactiva un rol personalizado SIN borrar sus permisos en roles_permisos
   * (Corrige el detalle crítico #4 de la Sección 2.2 de la especificación)
   */
  static async toggleRolActivo(rol: RolRBAC, nuevoActivo: boolean): Promise<RolRBAC> {
    assertPermission('ADMINISTRAR_ROLES', 'activar o desactivar roles')

    if (rol.es_sistema) {
      throw new Error('Los roles de sistema están protegidos y no pueden desactivarse.')
    }

    const { data, error } = await supabase
      .from('roles')
      .update({ activo: nuevoActivo })
      .eq('id_rol', rol.id_rol)
      .select('*, roles_permisos(count), usuarios_roles(count)')
      .single()

    if (error) {
      throw new Error(error.message || 'No se pudo actualizar el estado del rol.')
    }

    await useAuthStore.getState().refreshPermissions()
    return mapRowToRol(data)
  }

  /**
   * 8. Actualiza metadatos del rol y reemplaza atómicamente su set de permisos (DELETE + bulk INSERT)
   */
  static async updateRolPermisos(rol: RolRBAC, permisoIds: number[]): Promise<void> {
    assertPermission('ADMINISTRAR_ROLES', 'modificar roles y permisos')

    const cleanName = rol.nombre.trim().toUpperCase()
    if (cleanName === 'ADMINISTRADOR') {
      throw new Error('El rol ADMINISTRADOR posee acceso completo heredado y no puede ser modificado.')
    }

    const { error: updateErr } = await supabase
      .from('roles')
      .update({
        nombre: rol.es_sistema ? rol.nombre : cleanName,
        descripcion: rol.descripcion?.trim() || null,
        activo: rol.es_sistema ? true : rol.activo,
      })
      .eq('id_rol', rol.id_rol)

    if (updateErr) {
      if (updateErr.code === '23505') {
        throw new Error(`Ya existe otro rol con el nombre "${cleanName}" en esta clínica.`)
      }
      throw new Error(updateErr.message || 'Error al actualizar los datos del rol.')
    }

    const { error: deleteErr } = await supabase
      .from('roles_permisos')
      .delete()
      .eq('id_rol', rol.id_rol)

    if (deleteErr) {
      throw new Error(deleteErr.message || 'Error al limpiar permisos anteriores del rol.')
    }

    const uniquePermisoIds = Array.from(new Set(permisoIds))
    if (uniquePermisoIds.length > 0) {
      const inserts = uniquePermisoIds.map((id_permiso) => ({
        id_rol: rol.id_rol,
        id_permiso,
      }))
      const { error: insertErr } = await supabase
        .from('roles_permisos')
        .insert(inserts)

      if (insertErr) {
        throw new Error(insertErr.message || 'Error al guardar los nuevos permisos del rol.')
      }
    }

    await useAuthStore.getState().refreshPermissions()
  }

  /**
   * 9. Elimina un rol personalizado (bloqueado para roles de sistema)
   */
  static async deleteRol(rol: RolRBAC): Promise<void> {
    assertPermission('ADMINISTRAR_ROLES', 'eliminar roles')

    if (rol.es_sistema) {
      throw new Error('Los roles de sistema están protegidos y no pueden eliminarse.')
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id_rol', rol.id_rol)
      .eq('es_sistema', false)

    if (error) {
      throw new Error(error.message || 'No se pudo eliminar el rol personalizado.')
    }

    await useAuthStore.getState().refreshPermissions()
  }

  /**
   * 10. Obtiene el Rol RBAC asignado a un miembro del personal
   */
  static async getPersonaRol(idPersona: number): Promise<RolRBAC | null> {
    const { data, error } = await supabase
      .from('usuarios_roles')
      .select('id_rol, roles(*)')
      .eq('id_persona', idPersona)
      .maybeSingle()

    if (error || !data || !(data as any).roles) {
      return null
    }

    return mapRowToRol((data as any).roles)
  }

  /**
   * 11. Asigna o cambia el rol RBAC de un miembro del personal y sincroniza personal.rol ('MED' | 'ADM')
   */
  static async asignarRolAPersona(
    idPersona: number,
    idRol: number,
    options?: { rolNombre?: string; currentBaseRol?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('usuarios_roles')
      .upsert({
        id_persona: idPersona,
        id_rol: idRol,
      })

    if (error) {
      throw new Error(error.message || 'No se pudo asignar el rol al colaborador.')
    }

    // Sincronizar campo legacy personal.rol ('MED' si es VETERINARIO, 'ADM' en otro caso, respetando 'PRO')
    if (options?.rolNombre && options?.currentBaseRol !== 'PRO') {
      const syncedRol = syncStaffBaseRole(options.rolNombre, options.currentBaseRol)
      await supabase
        .from('personal')
        .update({ rol: syncedRol })
        .eq('id_persona', idPersona)
    }

    await useAuthStore.getState().refreshPermissions()
  }
}

