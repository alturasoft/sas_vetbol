import React, { useState, useEffect } from 'react'
import { UserCheck, User, Check, Loader2, Sparkles } from 'lucide-react'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { appointmentsService } from '@/services/appointments.service'
import type { DoctorOption, NewAppointmentFormState } from '@/types/appointment.types'

interface StepDoctorSelectionProps {
  vetId: number
  formState: NewAppointmentFormState
  onChange: (updates: Partial<NewAppointmentFormState>) => void
  onDoctorsLoaded?: (doctors: DoctorOption[]) => void
}

export const StepDoctorSelection: React.FC<StepDoctorSelectionProps> = ({
  vetId,
  formState,
  onChange,
  onDoctorsLoaded,
}) => {
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadDoctors = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await appointmentsService.getMedicalStaff(vetId)
        if (isMounted) {
          setDoctors(data)
          if (onDoctorsLoaded) onDoctorsLoaded(data)
        }
      } catch (err: any) {
        console.error('Error al cargar personal médico:', err)
        if (isMounted) setError(err?.message || 'Error al obtener personal médico.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDoctors()
    return () => {
      isMounted = false
    }
  }, [vetId, onDoctorsLoaded])

  const handleSelectAuto = () => {
    onChange({
      isAutoDoctor: true,
      selectedDoctorId: null,
      selectedDoctorName: 'Primer Médico Disponible',
      selectedSlot: null, // Reiniciar slot seleccionado
    })
  }

  const handleSelectDoctor = (doc: DoctorOption) => {
    const fullName = `${doc.nombres} ${doc.apellidos}`.trim()
    onChange({
      isAutoDoctor: false,
      selectedDoctorId: doc.id_persona,
      selectedDoctorName: fullName,
      selectedSlot: null, // Reiniciar slot seleccionado
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cargando profesionales médicos...</p>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Selecciona al Profesional *
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
          {doctors.length} médico{doctors.length === 1 ? '' : 's'} activo{doctors.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Opción 1: Primer Veterinario Disponible */}
        <button
          type="button"
          onClick={handleSelectAuto}
          className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
            formState.isAutoDoctor
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500 dark:ring-emerald-500/50 shadow-sm'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                formState.isAutoDoctor
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Cualquier Médico Disponible</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50 text-[10px] font-bold">
                  Recomendado
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                Asigna automáticamente el turno al primer profesional con espacio libre en la fecha.
              </p>
            </div>
          </div>

          {formState.isAutoDoctor && (
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
          )}
        </button>

        {/* Separador */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            O selecciona un profesional específico
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>

        {/* Listado de Médicos Específicos */}
        {doctors.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
            <User className="w-5 h-5 text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No hay personal médico específico registrado</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-400">
              Puedes agendar con el comodín de autoasignación.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
            {doctors.map((doc) => {
              const isSelected =
                !formState.isAutoDoctor && formState.selectedDoctorId === doc.id_persona
              const fullName = `${doc.nombres} ${doc.apellidos}`.trim()

              return (
                <button
                  key={doc.id_persona}
                  type="button"
                  onClick={() => handleSelectDoctor(doc)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500 dark:ring-emerald-500/50 shadow-sm'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <OptimizedImage
                        src={doc.foto_url}
                        alt={fullName}
                        containerClassName="w-full h-full"
                        fallback={<User className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{fullName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {doc.rol === 'VETERINARIO' || doc.rol === 'MED'
                          ? 'Médico Veterinario'
                          : doc.rol || 'Profesional'}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
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
