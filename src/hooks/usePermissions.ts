import { useMemo } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { PermissionService } from '@/lib/permissions'
import type { PermisoCodigo } from '@/types/database.types'

/**
 * Hook para control granular de permisos RBAC en componentes y vistas (Sección 3.3 y 3.4)
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const refreshPermissions = useAuthStore((state) => state.refreshPermissions)

  const permissionService = useMemo(() => {
    if (!user) return new PermissionService('', [])
    const effectiveRole =
      user.role === 'superadmin' || user.rol_codigo === 'SUPERADMIN'
        ? 'SUPERADMIN'
        : user.rol_codigo || (user.role === 'clinic_admin' ? 'ADMINISTRADOR' : user.role.toUpperCase())
    return new PermissionService(effectiveRole, user.permisos || [])
  }, [user])

  const hasPermission = (permission: PermisoCodigo | string): boolean => {
    if (!user) return false
    return permissionService.hasPermission(permission)
  }

  const hasAnyPermission = (permissions: (PermisoCodigo | string)[]): boolean => {
    if (!user) return false
    return permissionService.hasAnyPermission(permissions)
  }

  const hasAllPermissions = (permissions: (PermisoCodigo | string)[]): boolean => {
    if (!user) return false
    return permissionService.hasAllPermissions(permissions)
  }

  const canView = (modulo: string): boolean => {
    if (!user) return false
    return permissionService.canView(modulo)
  }

  const canCreate = (modulo: string): boolean => {
    if (!user) return false
    return permissionService.canCreate(modulo)
  }

  const canEdit = (modulo: string): boolean => {
    if (!user) return false
    return permissionService.canEdit(modulo)
  }

  const canDelete = (modulo: string): boolean => {
    if (!user) return false
    return permissionService.canDelete(modulo)
  }

  const rolNombre =
    user?.rol_codigo === 'PRO'
      ? 'ADMINISTRADOR'
      : user?.rol_codigo === 'MED'
      ? 'VETERINARIO'
      : user?.rol_codigo === 'ADM'
      ? 'RECEPCION'
      : user?.rol_codigo || (user?.role === 'clinic_admin' ? 'ADMINISTRADOR' : 'VETERINARIO')

  return {
    user,
    isLoading,
    rolNombre,
    permissions: user?.permisos || [],
    permissionService,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refreshPermissions,
    isSuperAdmin: user?.role === 'superadmin' || user?.rol_codigo === 'SUPERADMIN',
    isAdmin:
      user?.role === 'clinic_admin' ||
      user?.rol_codigo === 'ADMINISTRADOR' ||
      user?.rol_codigo === 'PRO',
    isVeterinarian:
      user?.role === 'veterinarian' ||
      user?.rol_codigo === 'VETERINARIO' ||
      user?.rol_codigo === 'MED',
  }
}
