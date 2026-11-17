import React from 'react'
import {
  User,
  Dog,
  Stethoscope,
  Calendar,
  Clock,
  Tag,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { NewAppointmentFormState } from '@/types/appointment.types'

interface StepConfirmationProps {
  formState: NewAppointmentFormState
  onChange: (updates: Partial<NewAppointmentFormState>) => void
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({
  formState,
  onChange,
}) => {
  const {
    selectedClient,
    selectedPet,
    selectedService,
    selectedDoctorName,
    selectedDate,
    selectedSlot,
    motivo,
    observaciones,
  } = formState

  const durationMin = selectedService?.duracion_minutos || 20
  const startTime = selectedSlot ? format(selectedSlot.slot, 'hh:mm a') : '--:--'
  const endTime = selectedSlot
    ? format(new Date(selectedSlot.slot.getTime() + durationMin * 60 * 1000), 'hh:mm a')
    : '--:--'
  const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })

  return (
    <div className="space-y-6">
      {/* Tarjeta de Resumen Consolidado */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Resumen de la Cita Médica</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Propietario */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Propietario</span>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {selectedClient?.nombres} {selectedClient?.apellidos}
              </p>
              {selectedClient?.telefono && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Tel: {selectedClient.telefono}</p>
              )}
            </div>
          </div>

          {/* Mascota */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Dog className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Paciente</span>
              <p className="font-bold text-slate-800 dark:text-slate-100">{selectedPet?.nombre}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedPet?.especie} {selectedPet?.raza ? `• ${selectedPet.raza}` : ''}
              </p>
            </div>
          </div>

          {/* Servicio */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Servicio y Duración</span>
              <p className="font-bold text-slate-800 dark:text-slate-100">{selectedService?.nombre}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {durationMin} minutos •{' '}
                {selectedService?.precio != null && Number(selectedService.precio) > 0
                  ? `Bs. ${Number(selectedService.precio).toFixed(2)}`
                  : 'A cotizar'}
              </p>
            </div>
          </div>

          {/* Médico */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Profesional Asignado</span>
              <p className="font-bold text-slate-800 dark:text-slate-100">{selectedDoctorName || 'Médico de Turno'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Consulta clínica especializada</p>
            </div>
          </div>
        </div>

        {/* Franja de Fecha y Hora destacada */}
        <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-bold text-xs capitalize">
            <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {startTime} - {endTime}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario de Motivo y Observaciones */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Motivo de la Consulta / Cita *
          </label>
          <input
            type="text"
            placeholder="Ej: Control de rutina, vacunación anual, decaimiento..."
            value={motivo}
            onChange={(e) => onChange({ motivo: e.target.value })}
            className="w-full h-11 px-4 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Observaciones o Notas Internas (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Notas previas para el médico veterinario o recepción..."
            value={observaciones}
            onChange={(e) => onChange({ observaciones: e.target.value })}
            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
          />
        </div>
      </div>
    </div>
  )
}
