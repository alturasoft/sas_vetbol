import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Dog,
  Sparkles,
  Stethoscope,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/stores/useToastStore'
import { appointmentsService } from '@/services/appointments.service'
import type {
  DoctorOption,
  NewAppointmentFormState,
} from '@/types/appointment.types'

import { StepPatientSelection } from './steps/StepPatientSelection'
import { StepServiceSelection } from './steps/StepServiceSelection'
import { StepDoctorSelection } from './steps/StepDoctorSelection'
import { StepDateTimeSelection } from './steps/StepDateTimeSelection'
import { StepConfirmation } from './steps/StepConfirmation'

interface NewAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  vetId: number
  onSuccess: () => void
  initialClientId?: number
  initialPetId?: number
}

const initialFormState: NewAppointmentFormState = {
  selectedClient: null,
  selectedPet: null,
  selectedService: null,
  isAutoDoctor: true,
  selectedDoctorId: null,
  selectedDoctorName: 'Primer Médico Disponible',
  selectedDate: new Date(),
  selectedSlot: null,
  motivo: '',
  observaciones: '',
}

const STEPS = [
  { id: 0, title: 'Paciente', icon: Dog },
  { id: 1, title: 'Servicio', icon: Sparkles },
  { id: 2, title: 'Médico', icon: Stethoscope },
  { id: 3, title: 'Fecha/Hora', icon: Calendar },
  { id: 4, title: 'Confirmar', icon: CheckCircle2 },
]

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  vetId,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formState, setFormState] = useState<NewAppointmentFormState>(initialFormState)
  const [doctorsList, setDoctorsList] = useState<DoctorOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reiniciar estado al abrir/cerrar y pre-cargar médicos
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setFormState(initialFormState)
      if (vetId) {
        appointmentsService
          .getMedicalStaff(vetId)
          .then((docs) => {
            setDoctorsList(docs)
          })
          .catch((err) => {
            console.warn('Error pre-cargando lista de médicos:', err)
          })
      }
    }
  }, [isOpen, vetId])

  if (!isOpen) return null

  const handleUpdateForm = (updates: Partial<NewAppointmentFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }))
  }

  // Validación de paso para habilitar botón "Siguiente"
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return !!(
          formState.selectedClient &&
          formState.selectedPet &&
          formState.selectedPet.estado !== 'EPC'
        )
      case 1:
        return !!formState.selectedService
      case 2:
        return formState.isAutoDoctor || !!formState.selectedDoctorId
      case 3:
        return !!formState.selectedSlot
      case 4:
        return formState.motivo.trim().length > 0
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && isStepValid()) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!formState.selectedClient || !formState.selectedPet || !formState.selectedService || !formState.selectedSlot) {
      toast.error('Faltan datos obligatorios para agendar la cita.')
      return
    }

    const doctorId = formState.selectedSlot.idPersona || formState.selectedDoctorId
    if (!doctorId) {
      toast.error('No se pudo asignar un médico a la cita.')
      return
    }

    try {
      setIsSubmitting(true)

      await appointmentsService.createAppointment({
        idVeterinaria: vetId,
        idCliente: formState.selectedClient.id_cliente,
        idMascota: formState.selectedPet.id_mascota,
        idPersona: doctorId,
        idServicio: formState.selectedService.id_servicio,
        fechaInicio: formState.selectedSlot.slot,
        duracionMinutos: formState.selectedService.duracion_minutos,
        motivo: formState.motivo.trim(),
        observaciones: formState.observaciones.trim(),
        origen: 'WEB',
      })

      toast.success('¡Cita médica programada con éxito!', 'Cita Registrada')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error al guardar cita:', err)
      toast.error(err?.message || 'Error al registrar la cita médica.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal con Stepper */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50">
                <PlusCircle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                  Agendar Nueva Cita Médica
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Visual */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              const isPast = idx < currentStep
              const isCurrent = idx === currentStep
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isPast
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 transition-colors ${
                        idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Cuerpo del Asistente */}
        <div className="p-6 overflow-y-auto flex-1">
          {currentStep === 0 && (
            <StepPatientSelection
              vetId={vetId}
              formState={formState}
              onChange={handleUpdateForm}
            />
          )}

          {currentStep === 1 && (
            <StepServiceSelection
              vetId={vetId}
              formState={formState}
              onChange={handleUpdateForm}
            />
          )}

          {currentStep === 2 && (
            <StepDoctorSelection
              vetId={vetId}
              formState={formState}
              onChange={handleUpdateForm}
              onDoctorsLoaded={setDoctorsList}
            />
          )}

          {currentStep === 3 && (
            <StepDateTimeSelection
              vetId={vetId}
              doctors={doctorsList}
              formState={formState}
              onChange={handleUpdateForm}
            />
          )}

          {currentStep === 4 && (
            <StepConfirmation formState={formState} onChange={handleUpdateForm} />
          )}
        </div>

        {/* Footer con Botones de Navegación */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shrink-0">
          <div>
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={isSubmitting}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancelar
              </Button>
            )}
          </div>

          <div>
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Cita...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar y Agendar Cita</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
