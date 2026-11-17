import React, { useState, useEffect } from 'react'
import { Clock, Check, Loader2, Sparkles, Tag } from 'lucide-react'
import { appointmentsService } from '@/services/appointments.service'
import type { Servicios } from '@/types/database.types'
import type { NewAppointmentFormState } from '@/types/appointment.types'

interface StepServiceSelectionProps {
  vetId: number
  formState: NewAppointmentFormState
  onChange: (updates: Partial<NewAppointmentFormState>) => void
}

export const StepServiceSelection: React.FC<StepServiceSelectionProps> = ({
  vetId,
  formState,
  onChange,
}) => {
  const [services, setServices] = useState<Servicios[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadServices = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await appointmentsService.getActiveServices(vetId)
        if (isMounted) {
          setServices(data as unknown as Servicios[])
        }
      } catch (err: any) {
        console.error('Error al cargar catálogo de servicios:', err)
        if (isMounted) setError(err?.message || 'Error al cargar servicios.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadServices()
    return () => {
      isMounted = false
    }
  }, [vetId])

  const handleSelectService = (service: Servicios) => {
    onChange({
      selectedService: {
        id_servicio: service.id_servicio,
        nombre: service.nombre,
        descripcion: service.descripcion,
        duracion_minutos: service.duracion_minutos || 20,
        precio: service.precio,
        color: service.color,
      },
      // Reiniciar selección de horario al cambiar servicio por posible cambio de duración
      selectedSlot: null,
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cargando catálogo de servicios...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium text-center">
        {error}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
        <Sparkles className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto" />
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">No hay servicios clínicos activos</h4>
        <p className="text-[11px] text-slate-400 dark:text-slate-400 max-w-xs mx-auto">
          Configura los servicios en el módulo de ajustes antes de agendar turnos médicos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Selecciona el Servicio Médico *
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
          {services.length} servicio{services.length === 1 ? '' : 's'} disponible{services.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {services.map((service) => {
          const isSelected = formState.selectedService?.id_servicio === service.id_servicio
          const duration = service.duracion_minutos || 20
          const color = service.color || '#10B981'

          return (
            <button
              key={service.id_servicio}
              type="button"
              onClick={() => handleSelectService(service)}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500 dark:ring-emerald-500/50 shadow-sm'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 shadow-xs'
              }`}
            >
              {/* Barra de color de servicio superior */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: color }}
              />

              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {service.nombre}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {service.descripcion && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {service.descripcion}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{duration} min</span>
                </div>

                <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                  <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {service.precio != null && Number(service.precio) > 0
                      ? `Bs. ${Number(service.precio).toFixed(2)}`
                      : 'A cotizar'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
