import React from 'react'
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CalendarViewMode } from '@/types/appointment.types'
import { Button } from '@/components/ui/button'

interface AppointmentsViewSelectorProps {
  currentView: CalendarViewMode
  onViewChange: (view: CalendarViewMode) => void
  currentDate: Date
  onPrevDate: () => void
  onNextDate: () => void
  onToday: () => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
}

export const AppointmentsViewSelector: React.FC<AppointmentsViewSelectorProps> = ({
  currentView,
  onViewChange,
  currentDate,
  onPrevDate,
  onNextDate,
  onToday,
  statusFilter,
  onStatusFilterChange,
}) => {
  // Generar etiqueta descriptiva del período según la vista
  const getPeriodLabel = () => {
    try {
      if (currentView === 'day') {
        return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
      }
      if (currentView === 'week') {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        const startText = format(weekStart, "d 'de' MMM", { locale: es })
        const endText = format(weekEnd, "d 'de' MMM yyyy", { locale: es })
        return `Semana: ${startText} - ${endText}`
      }
      // month
      return format(currentDate, "MMMM 'de' yyyy", { locale: es })
    } catch {
      return currentDate.toLocaleDateString()
    }
  }

  const getTodayButtonText = () => {
    if (currentView === 'day') return 'Hoy'
    if (currentView === 'week') return 'Esta Semana'
    return 'Este Mes'
  }

  const statusOptions = [
    { id: 'all', label: 'Todas' },
    { id: 'scheduled', label: 'Programadas' },
    { id: 'confirmed', label: 'Confirmadas' },
    { id: 'in_progress', label: 'En Consulta' },
    { id: 'completed', label: 'Completadas' },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Fila Superior: Selector de Vista (Día / Semana / Mes) y Controles Temporales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Switcher de Vistas */}
        <nav aria-label="Modo de vista de citas" className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start">
          <button
            type="button"
            onClick={() => onViewChange('day')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'day'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Día</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('week')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'week'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            <span>Semana</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('month')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'month'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Mes</span>
          </button>
        </nav>

        {/* Navegador Temporal (< Hoy > y fecha formateada) */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onPrevDate}
              aria-label="Periodo anterior"
              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToday}
              className="h-8 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg cursor-pointer transition-colors"
            >
              {getTodayButtonText()}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onNextDate}
              aria-label="Siguiente periodo"
              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 capitalize px-2.5 py-1 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
            {getPeriodLabel()}
          </span>
        </div>
      </div>

      {/* Fila Inferior: Filtros de Estado */}
      <div className="flex items-center flex-wrap justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estado:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {statusOptions.map((opt) => {
            const isSelected = statusFilter === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onStatusFilterChange(opt.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
