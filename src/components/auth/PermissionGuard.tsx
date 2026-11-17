import { ReactNode } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { ShieldAlert, Lock, ArrowLeft, KeyRound, Loader2 } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import type { PermisoCodigo } from '@/types/database.types'

interface PermissionGuardProps {
  permission: PermisoCodigo | string | (PermisoCodigo | string)[]
  requireAll?: boolean
  fallbackPath?: string
  redirectOnDeny?: boolean
  hideOnDeny?: boolean
  children?: ReactNode
}

/**
 * PermissionGuard (Nivel de Ruta/Pantalla — Sección 3.5 de Especificación RBAC):
 * Envuelve las pantallas protegidas en AppRouter. Mientras carga muestra un indicador;
 * si el usuario no cuenta con el permiso, renderiza la vista de "Acceso Restringido"
 * indicando el código de permiso faltante y el rol actual.
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  fallbackPath = '/dashboard',
  redirectOnDeny = false,
  hideOnDeny = false,
  children,
}: PermissionGuardProps) {
  const { isLoading, rolNombre, hasAnyPermission, hasAllPermissions } = usePermissions()

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="text-xs font-medium">Verificando permisos de acceso...</span>
      </div>
    )
  }

  const permissionsList = Array.isArray(permission) ? permission : [permission]
  const isAuthorized = requireAll
    ? hasAllPermissions(permissionsList)
    : hasAnyPermission(permissionsList)

  if (!isAuthorized) {
    if (hideOnDeny) {
      return null
    }
    if (redirectOnDeny) {
      return <Navigate to={fallbackPath} replace />
    }

    const missingCodes = permissionsList.join(' / ')

    return (
      <div className="py-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Acceso Restringido
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tu perfil actual (<strong className="text-slate-700 dark:text-slate-200">{rolNombre}</strong>) no cuenta con los privilegios necesarios para acceder a este módulo de la clínica.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                Permiso requerido:
              </span>
              <code className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 font-mono text-[11px] font-bold">
                {missingCodes}
              </code>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Si necesitas acceso a esta función, solicita al Administrador de la clínica que habilite este permiso en tu rol.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to={fallbackPath} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Volver al Inicio
              </Button>
            </Link>
            <Link to="/visor-permisos" className="w-full sm:w-auto">
              <Button
                size="sm"
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                Mis Accesos y Permisos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
