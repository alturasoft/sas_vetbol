import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar as CalendarIcon, Clock, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { format, addDays, isSameDay, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { appointmentsService } from '@/services/appointments.service'
import type { DoctorOption, NewAppointmentFormState, TimeSlot } from '@/types/appointment.types'

interface StepDateTimeSelectionProps {
  vetId: number
  doctors: DoctorOption[]
  formState: NewAppointmentFormState
  onChange: (updates: Partial<NewAppointmentFormState>) => void
}

export const StepDateTimeSelection: React.FC<StepDateTimeSelectionProps> = ({
  vetId,
  doctors,
  formState,
  onChange,
}) => {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState<string | null>(null)

  const today = useMemo(() => startOfDay(new Date()), [])
  const maxDate = useMemo(() => addDays(today, 90), [today])

  // Cargar slots cuando cambia la fecha, el médico o el servicio
  const loadSlots = useCallback(async () => {
    if (!formState.selectedService) return

    try {
      setIsLoadingSlots(true)
      setSlotError(null)

      let available: TimeSlot[] = []

      if (formState.isAutoDoctor) {
        available = await appointmentsService.getAllDoctorsAvailableSlots({
          idVeterinaria: vetId,
          doctors,
          fecha: formState.selectedDate,
          duracionMinutos: formState.selectedService.duracion_minutos,
        })
      } else if (formState.selectedDoctorId) {
        available = await appointmentsService.getDoctorAvailableSlots({
          idVeterinaria: vetId,
          idPersona: formState.selectedDoctorId,
          fecha: formState.selectedDate,
          duracionMinutos: formState.selectedService.duracion_minutos,
          doctorName: formState.selectedDoctorName,
        })
      }

      setSlots(available)

      // Si el slot previamente seleccionado ya no está disponible, deseleccionarlo
      if (formState.selectedSlot) {
        const stillValid = available.some(
          (s) => s.slot.getTime() === formState.selectedSlot?.slot.getTime()
        )
        if (!stillValid) {
          onChange({ selectedSlot: null })
        }
      }
    } catch (err: any) {
      console.error('Error al calcular slots:', err)
      setSlotError(err?.message || 'Error al obtener horarios disponibles.')
    } finally {
      setIsLoadingSlots(false)
    }
  }, [
    vetId,
    doctors,
    formState.selectedDate,
    formState.isAutoDoctor,
    formState.selectedDoctorId,
    formState.selectedDoctorName,
    formState.selectedService,
  ])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  // Formato YYYY-MM-DD para el input nativo de fecha
  const inputDateValue = useMemo(() => {
    const y = formState.selectedDate.getFullYear()
    const m = String(formState.selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(formState.selectedDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [formState.selectedDate])

  const minDateValue = useMemo(() => {
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [today])

  const maxDateValue = useMemo(() => {
    const y = maxDate.getFullYear()
    const m = String(maxDate.getMonth() + 1).padStart(2, '0')
    const d = String(maxDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [maxDate])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    const [y, m, d] = e.target.value.split('-').map(Number)
    const newDate = new Date(y, m - 1, d)

    if (isBefore(startOfDay(newDate), today)) return

    onChange({
      selectedDate: newDate,
      selectedSlot: null,
    })
  }

  const handleSelectSlot = (slotItem: TimeSlot) => {
    onChange({
      selectedSlot: slotItem,
      // Si estaba en modo automático, fijar el médico que quedó asignado a este horario
      ...(formState.isAutoDoctor
        ? {
            selectedDoctorId: slotItem.idPersona,
            selectedDoctorName: slotItem.doctorName || 'Médico Asignado',
          }
        : {}),
    })
  }

  // Generar 5 días rápidos para seleccionar rápidamente
  const quickDays = useMemo(() => {
    return [0, 1, 2, 3, 4].map((offset) => addDays(today, offset))
  }, [today])

  const formattedDateTitle = format(formState.selectedDate, "EEEE, d 'de' MMMM", {
    locale: es,
  })

  return (
    <div className="space-y-6">
      {/* Selector de Fecha */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            1. Selecciona la Fecha del Turno *
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize font-medium">
            {formattedDateTitle}
          </span>
        </div>

        {/* Accesos rápidos a los próximos días */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {quickDays.map((qDay) => {
            const isSelected = isSameDay(formState.selectedDate, qDay)
            const isToday = isSameDay(today, qDay)

            return (
              <button
                key={qDay.toISOString()}
                type="button"
                onClick={() => {
                  onChange({ selectedDate: qDay, selectedSlot: null })
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border shrink-0 transition-all cursor-pointer flex flex-col items-center min-w-[76px] ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold opacity-80">
                  {isToday ? 'Hoy' : format(qDay, 'EEE', { locale: es })}
                </span>
                <span className="text-sm font-black">{format(qDay, 'd MMM', { locale: es })}</span>
              </button>
            )
          })}
        </div>

        {/* Input de Fecha Nativo para fechas más lejanas dentro de 90 días */}
        <div className="relative">
          <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="date"
            value={inputDateValue}
            min={minDateValue}
            max={maxDateValue}
            onChange={handleDateChange}
            className="w-full h-11 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100 font-medium [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      {/* Grilla de Horarios Disponibles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            2. Horarios Disponibles ({formState.selectedService?.duracion_minutos || 20} min de duración) *
          </label>
          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
            {slots.length} horario{slots.length === 1 ? '' : 's'} libre{slots.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoadingSlots ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40">
            <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Calculando disponibilidad de agenda...
            </span>
          </div>
        ) : slotError ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{slotError}</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Sin turnos disponibles para esta fecha</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
              No hay horarios libres o los turnos del profesional ya han concluido. Intenta seleccionando otro día o la opción de cualquier médico disponible.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {slots.map((slotItem) => {
              const isSelected =
                formState.selectedSlot?.slot.getTime() === slotItem.slot.getTime()

              return (
                <button
                  key={slotItem.slot.toISOString() + slotItem.idPersona}
                  type="button"
                  onClick={() => handleSelectSlot(slotItem)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="text-xs font-bold">{slotItem.label}</span>
                  </div>

                  {formState.isAutoDoctor && slotItem.doctorName && (
                    <span
                      className={`text-[9px] truncate max-w-[110px] font-medium ${
                        isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
                      }`}
                      title={slotItem.doctorName}
                    >
                      {slotItem.doctorName}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
