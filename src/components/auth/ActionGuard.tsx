import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermisoCodigo } from '@/types/database.types'

interface ActionGuardProps {
  permission: PermisoCodigo | string | (PermisoCodigo | string)[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

/**
 * ActionGuard (Nivel de Componente/Acción — Sección 3.5 de Especificación RBAC):
 * Envuelve botones, tarjetas o ítems de UI. Si el usuario no posee el permiso requerido
 * (o mientras la sesión está cargando), oculta el elemento del árbol DOM (retorna null).
 */
export function ActionGuard({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: ActionGuardProps) {
  const { isLoading, hasAnyPermission, hasAllPermissions } = usePermissions()

  if (isLoading) {
    return null
  }

  const permissionsList = Array.isArray(permission) ? permission : [permission]
  const isAuthorized = requireAll
    ? hasAllPermissions(permissionsList)
    : hasAnyPermission(permissionsList)

  if (!isAuthorized) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

