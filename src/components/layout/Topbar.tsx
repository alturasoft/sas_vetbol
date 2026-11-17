import { Link } from 'react-router-dom'
import { Menu, Bell, Search, KeyRound } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/common/ThemeToggle'

interface TopbarProps {
  onOpenMobileMenu: () => void
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const { user, rolNombre } = usePermissions()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-150">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-500 dark:text-slate-400 rounded-lg lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar mockup */}
        <div className="relative hidden md:flex items-center w-72">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar paciente, cliente o ficha..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Current user RBAC role indicator & shortcut to Visor de Permisos */}
        {user && (
          <Link
            to="/visor-permisos"
            title="Ver Mis Accesos y Permisos"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-200 dark:hover:border-emerald-800 text-xs transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Rol:
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {rolNombre}
            </span>
          </Link>
        )}

        {/* Theme Selector Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
          title="Centro de notificaciones y avisos"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Current status */}
        <Badge variant="success" className="hidden sm:inline-flex items-center gap-1.5 text-[11px] py-1 px-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          En línea
        </Badge>
      </div>
    </header>
  )
}
