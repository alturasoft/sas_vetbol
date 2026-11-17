import React from 'react'
import { startOfWeek, addDays, isSameDay, isToday, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Dog, Calendar as CalendarIcon, ArrowUpRight } from 'lucide-react'
import type { RealAppointmentItem } from '@/types/appointment.types'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'

interface AppointmentWeekViewProps {
  appointments: RealAppointmentItem[]
  selectedDate: Date
  isLoading: boolean
  onSelectAppointment: (apt: RealAppointmentItem) => void
  onSelectDay: (date: Date) => void
}

export const AppointmentWeekView: React.FC<AppointmentWeekViewProps> = ({
  appointments,
  selectedDate,
  isLoading,
  onSelectAppointment,
  onSelectDay,
}) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Lunes
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-4">
      {/* Banner explicativo y selector rápido */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500">
          Haz clic en la cabecera de cualquier día para ver la <strong className="text-emerald-700 font-bold">agenda detallada de ese día</strong>.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 py-4">
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
          {daysOfWeek.map((day) => {
            const dayAppointments = appointments.filter((apt) =>
              isSameDay(new Date(apt.start_time), day)
            )
            const count = dayAppointments.length
            const isCurrentToday = isToday(day)
            const dayName = format(day, 'EEE', { locale: es })
            const dayNum = format(day, 'd')

            return (
              <div
                key={day.toISOString()}
                className={`flex flex-col rounded-2xl border transition-all bg-white dark:bg-slate-900 min-h-[360px] overflow-hidden ${
                  isCurrentToday
                    ? 'border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Cabecera del Día: Click para ir a la vista diaria */}
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`p-3 text-left border-b transition-colors cursor-pointer group flex items-center justify-between ${
                    isCurrentToday
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-100 dark:border-slate-800'
                  }`}
                  title={`Ver citas del ${format(day, "EEEE d 'de' MMMM", { locale: es })}`}
                >
                  <div className="space-y-0.5">
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                      isCurrentToday ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {dayName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-lg font-black ${
                        isCurrentToday ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {dayNum}
                      </span>
                      {isCurrentToday && (
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                          Hoy
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contador de citas del día con número prominente */}
                  <div className="flex items-center gap-1">
                    {count > 0 ? (
                      <span
                        className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs"
                        title={`${count} ${count === 1 ? 'cita programada' : 'citas programadas'}`}
                      >
                        {count}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        0
                      </span>
                    )}
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>

                {/* Lista de citas dentro del día */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[480px]">
                  {count === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400 dark:text-slate-500">
                      <CalendarIcon className="w-6 h-6 stroke-1 mb-1.5 text-slate-300 dark:text-slate-600" />
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Sin citas</span>
                    </div>
                  ) : (
                    dayAppointments.map((apt) => {
                      const timeStr = format(new Date(apt.start_time), 'HH:mm')
                      return (
                        <div
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-xs transition-all bg-white dark:bg-slate-800/70 cursor-pointer group space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                              <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              {timeStr}
                            </span>
                            <AppointmentStatusBadge
                              status={apt.status}
                              className="text-[10px] px-1.5 py-0"
                            />
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
                            <Dog className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{apt.patient_name}</span>
                          </p>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {apt.title || apt.reason}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
