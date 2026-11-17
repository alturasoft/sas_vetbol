import React from 'react'
import {
  Clock,
  Dog,
  User,
  Plus,
  Calendar as CalendarIcon,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { RealAppointmentItem } from '@/types/appointment.types'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AppointmentDayViewProps {
  appointments: RealAppointmentItem[]
  selectedDate: Date
  isLoading: boolean
  onSelectAppointment: (apt: RealAppointmentItem) => void
  onNewAppointment?: () => void
}

export const AppointmentDayView: React.FC<AppointmentDayViewProps> = ({
  appointments,
  selectedDate,
  isLoading,
  onSelectAppointment,
  onNewAppointment,
}) => {
  const formattedDateTitle = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })

  // Métricas del día
  const total = appointments.length
  const pending = appointments.filter((a) => a.status === 'PENDIENTE' || a.status === 'SCHEDULED').length
  const inProgress = appointments.filter((a) => a.status === 'EN_PROCESO' || a.status === 'IN_PROGRESS').length
  const completed = appointments.filter((a) => a.status === 'COMPLETADA' || a.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      {/* Resumen Métrico del Día */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Citas del Día</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{total}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">Programadas</p>
            <p className="text-2xl font-black text-sky-950 dark:text-sky-200 mt-1">{pending}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">En Consulta</p>
            <p className="text-2xl font-black text-amber-950 dark:text-amber-200 mt-1">{inProgress}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completadas</p>
            <p className="text-2xl font-black text-emerald-950 dark:text-emerald-200 mt-1">{completed}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Lista / Timeline de Citas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize flex items-center gap-2">
            <span>Agenda diaria:</span>
            <span className="text-emerald-700 dark:text-emerald-400">{formattedDateTitle}</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {total} {total === 1 ? 'cita programada' : 'citas programadas'}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/60">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3 shadow-xs">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No hay citas para este día</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
              No se encontraron citas agendadas para el {formattedDateTitle}. Puedes programar una nueva cita ahora mismo.
            </p>
            {onNewAppointment && (
              <Button
                onClick={onNewAppointment}
                size="sm"
                className="gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer h-9 px-4"
              >
                <Plus className="w-4 h-4" />
                <span>Programar Cita en Este Día</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {appointments.map((apt) => {
              const start = new Date(apt.start_time)
              const end = new Date(apt.end_time)
              const timeStart = format(start, 'HH:mm')
              const timeEnd = format(end, 'HH:mm')

              return (
                <Card
                  key={apt.id}
                  onClick={() => onSelectAppointment(apt)}
                  className="border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden group bg-white dark:bg-slate-900"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Bloque Horario */}
                      <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 min-w-[76px] text-center shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-slate-800/80 group-hover:border-emerald-200 dark:group-hover:border-slate-700 transition-colors">
                        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">{timeStart}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{timeEnd}</span>
                      </div>

                      {/* Detalles del Turno */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {apt.title}
                          </h3>
                          <AppointmentStatusBadge status={apt.status} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Dog className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {apt.patient_name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Dueño: <strong className="font-semibold text-slate-700 dark:text-slate-300">{apt.owner_name}</strong>
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                            {apt.veterinarian_name}
                          </span>
                        </div>

                        {apt.reason && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5 line-clamp-1">
                            Motivo: <span className="text-slate-700 dark:text-slate-300 font-medium">{apt.reason}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botón ver detalle */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold h-8 gap-1 border-slate-200 group-hover:border-emerald-400 group-hover:text-emerald-700"
                      >
                        <span>Ver Detalle</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
