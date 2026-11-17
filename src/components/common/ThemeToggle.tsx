import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import { useThemeStore, ThemeMode } from '@/stores/useThemeStore'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Modo Claro', icon: Sun },
    { mode: 'dark', label: 'Modo Oscuro', icon: Moon },
    { mode: 'system', label: 'Tema del Sistema', icon: Laptop },
  ]

  const ActiveIcon =
    theme === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun

  return (
    <div className={cn('relative inline-block text-left', className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100',
          'dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/80',
          'transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
          isOpen && 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100'
        )}
        aria-label="Cambiar tema de apariencia"
        title={`Tema actual: ${
          theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Oscuro' : 'Claro'
        }`}
      >
        <ActiveIcon className="w-4 h-4 transition-transform duration-200" />
        {showLabel && (
          <span className="text-xs font-semibold capitalize">
            {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Oscuro' : 'Claro'}
          </span>
        )}
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-44 rounded-2xl p-1.5 shadow-xl border z-50 animate-in fade-in zoom-in-95 duration-100',
            'bg-white border-slate-200 text-slate-800',
            'dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200'
          )}
          role="menu"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Apariencia
          </div>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon
              const isSelected = theme === opt.mode
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => {
                    setTheme(opt.mode)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                  )}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
