import React from 'react'
import { Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionGuard } from '@/components/auth/ActionGuard'

interface AppointmentsHeaderProps {
  clinicName?: string
  isLoading: boolean
  onRefresh: () => void
  onNewAppointment?: () => void
}

export const AppointmentsHeader: React.FC<AppointmentsHeaderProps> = ({
  clinicName,
  isLoading,
  onRefresh,
  onNewAppointment,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <CalendarIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          Citas y Agenda Médica
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Gestión y seguimiento de turnos de <strong className="text-slate-800 dark:text-slate-200">{clinicName || 'la clínica activa'}</strong>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 h-9 px-3 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Actualizar</span>
        </Button>
        <ActionGuard permission="CREAR_CITAS">
          <Button
            size="sm"
            onClick={onNewAppointment}
            className="gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 px-4 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </Button>
        </ActionGuard>
      </div>
    </header>
  )
}
