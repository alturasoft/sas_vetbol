import React from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowUpRight, Calendar as CalendarIcon, Clock } from 'lucide-react'
import type { RealAppointmentItem } from '@/types/appointment.types'

interface AppointmentMonthViewProps {
  appointments: RealAppointmentItem[]
  selectedDate: Date
  isLoading: boolean
  onSelectAppointment: (apt: RealAppointmentItem) => void
  onSelectDay: (date: Date) => void
}

export const AppointmentMonthView: React.FC<AppointmentMonthViewProps> = ({
  appointments,
  selectedDate,
  isLoading,
  onSelectAppointment,
  onSelectDay,
}) => {
  // Construir intervalo completo de días para la cuadrícula (de Lunes a Domingo)
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  // Métricas del mes en curso
  const monthAppointments = appointments.filter((apt) =>
    isSameMonth(new Date(apt.start_time), selectedDate)
  )
  const totalMonth = monthAppointments.length

  const getStatusColorDot = (status: string) => {
    const s = (status || '').toUpperCase()
    if (s === 'CONFIRMADA' || s === 'CONFIRMED') return 'bg-emerald-500'
    if (s === 'EN_PROCESO' || s === 'IN_PROGRESS') return 'bg-amber-500'
    if (s === 'COMPLETADA' || s === 'COMPLETED') return 'bg-slate-400'
    if (s === 'CANCELADA' || s === 'CANCELLED') return 'bg-rose-500'
    return 'bg-sky-500'
  }

  return (
    <div className="space-y-4">
      {/* Barra de ayuda y métricas del mes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <p className="text-xs text-slate-500">
          Haz clic en cualquier celda para saltar directamente a la <strong className="text-emerald-700 font-bold">agenda del día</strong>.
        </p>
        <span className="text-xs font-bold text-slate-700 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
          {totalMonth} {totalMonth === 1 ? 'cita en este mes' : 'citas en este mes'}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-2 py-4">
          {Array.from({ length: 35 }).map((_, idx) => (
            <div key={idx} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Cabecera de Días de la Semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
            {weekDayHeaders.map((header) => (
              <div
                key={header}
                className="py-3 text-center text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                {header}
              </div>
            ))}
          </div>

          {/* Matriz del Calendario */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 bg-slate-100/50 dark:bg-slate-800/40">
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, selectedDate)
              const isCurrentToday = isToday(day)

              const dayAppointments = appointments.filter((apt) =>
                isSameDay(new Date(apt.start_time), day)
              )
              const count = dayAppointments.length

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onSelectDay(day)}
                  className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between transition-all cursor-pointer group bg-white dark:bg-slate-900 ${
                    !isCurrentMonth
                      ? 'bg-slate-50/60 dark:bg-slate-950/60 text-slate-400 dark:text-slate-600'
                      : 'hover:bg-emerald-50/30 dark:hover:bg-slate-800/60'
                  } ${isCurrentToday ? 'ring-2 ring-inset ring-emerald-500' : ''}`}
                >
                  {/* Fila superior de la celda: Número del día y Cantidad de Citas */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs sm:text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isCurrentToday
                            ? 'bg-emerald-600 text-white font-black'
                            : isCurrentMonth
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Número indicando la cantidad de citas del día */}
                    {count > 0 && (
                      <span
                        className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform"
                        title={`${count} ${count === 1 ? 'cita programada' : 'citas programadas'}`}
                      >
                        {count}
                      </span>
                    )}
                  </div>

                  {/* Pastillas de citas (muestra hasta 2, y +N más) */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayAppointments.slice(0, 2).map((apt) => {
                      const timeStr = format(new Date(apt.start_time), 'HH:mm')
                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectAppointment(apt)
                          }}
                          className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-slate-750 transition-all flex items-center gap-1 truncate cursor-pointer shadow-xs"
                          title={`${timeStr} - ${apt.patient_name} (${apt.title || apt.reason})`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColorDot(
                              apt.status
                            )}`}
                          />
                          <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">{timeStr}</span>
                          <span className="text-slate-600 dark:text-slate-400 truncate">{apt.patient_name}</span>
                        </div>
                      )
                    })}

                    {count > 2 && (
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 pl-1 hover:underline">
                        +{count - 2} más...
                      </div>
                    )}
                  </div>

                  {/* Indicador de acción al pasar el ratón */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5 transition-opacity">
                    <span>Ir al día</span>
                    <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
