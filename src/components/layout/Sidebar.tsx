import { NavLink } from 'react-router-dom'
import { MAIN_NAVIGATION, SUPERADMIN_NAVIGATION } from '@/config/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePermissions } from '@/hooks/usePermissions'
import { TenantBadge } from './TenantBadge'
import { cn } from '@/lib/utils'
import { PawPrint, LogOut, ShieldCheck } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onCloseMobile?: () => void
}

export function Sidebar({ isOpen, onCloseMobile }: SidebarProps) {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const { hasPermission, isSuperAdmin } = usePermissions()

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <PawPrint className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-none tracking-tight">
              VetBol<span className="text-emerald-600 dark:text-emerald-400">SaaS</span>
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">Gestión Veterinaria</span>
          </div>
        </div>

        {/* Tenant selector indicator */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <TenantBadge />
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Operación Clínica
            </div>
            <nav className="space-y-1">
              {MAIN_NAVIGATION.map((item) => {
                // Check role restrictions
                if (item.roles && user && !item.roles.includes(user.role)) {
                  return null
                }
                // Check granular permission
                if (item.permission && !hasPermission(item.permission)) {
                  return null
                }

                const Icon = item.icon
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Superadmin Section if user is superadmin */}
          {isSuperAdmin && (
            <div>
              <div className="flex items-center gap-1.5 px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </div>
              <nav className="space-y-1">
                {SUPERADMIN_NAVIGATION.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                          isActive
                            ? "bg-amber-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-900 dark:hover:text-amber-300"
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {user?.foto_url || user?.avatar_url ? (
                <img
                  src={user.foto_url || user.avatar_url || ''}
                  alt={user.nombre_completo || user.full_name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200 dark:border-emerald-800/60">
                  {(user?.nombres?.[0] || 'V') + (user?.apellidos?.[0] || 'T')}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.nombre_completo || user?.full_name || 'Usuario'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {user?.rol_codigo || user?.role?.replace('_', ' ') || 'Veterinario'}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="Cerrar sesión"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
