import { useState } from 'react'
import { X, Check, ArrowRight, UserCheck, Dog, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepClientForm, type ClientFormData } from './StepClientForm'
import { StepPatientForm, type PatientFormData } from './StepPatientForm'
import { clientsService } from '@/services/clients.service'
import { patientsService } from '@/services/patients.service'
import { vaccinesService } from '@/services/vaccines.service'
import { storageService } from '@/services/storage.service'
import { toast } from '@/stores/useToastStore'
import { cn } from '@/lib/utils'
import type { Clientes } from '@/types/database.types'

interface ClientRegistrationDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tenantId: number
}

const INITIAL_CLIENT_DATA: ClientFormData = {
  nombres: '',
  apellidos: '',
  numero_ci: '',
  telefono: '',
  email: '',
  depto: 1, // La Paz por defecto
  fotoFile: null,
  photoPreview: null,
  isPhotoRemoved: false,
  optimizationInfo: null,
}

const INITIAL_PATIENT_DATA: PatientFormData = {
  nombre: '',
  especie: 'Perros',
  otraEspecie: '',
  raza: 'Mestizo/Criollo',
  sexo: 'MACHO',
  edad: '',
  edad_meses: '',
  fecha_nac: '',
  peso: '',
  fotoFile: null,
  photoPreview: null,
  isPhotoRemoved: false,
  optimizationInfo: null,
  vacunas: [],
}

export function ClientRegistrationDrawer({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
}: ClientRegistrationDrawerProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Datos del Cliente (Paso 1)
  const [clientData, setClientData] = useState<ClientFormData>(INITIAL_CLIENT_DATA)
  // Cliente ya persistido en DB
  const [createdClient, setCreatedClient] = useState<Clientes | null>(null)

  // Datos del Paciente (Paso 2)
  const [patientData, setPatientData] = useState<PatientFormData>(INITIAL_PATIENT_DATA)

  if (!isOpen) return null

  const handleResetAndClose = () => {
    setCurrentStep(1)
    setClientData(INITIAL_CLIENT_DATA)
    setPatientData(INITIAL_PATIENT_DATA)
    setCreatedClient(null)
    setIsSubmitting(false)
    onClose()
  }

  // --- PASO 1: Validación y Guardado de Cliente ---
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientData.nombres.trim() || !clientData.apellidos.trim()) {
      toast.warning('Por favor completa los nombres y apellidos del propietario.')
      return
    }

    if (!clientData.telefono.trim()) {
      toast.warning('Por favor ingresa un teléfono o número de WhatsApp válido.')
      return
    }

    if (!clientData.depto) {
      toast.warning('Por favor selecciona el departamento de residencia.')
      return
    }

    try {
      setIsSubmitting(true)

      let fotoUrl: string | null = null

      // 1. Subir fotografía al bucket 'clientes-fotos' si seleccionó una
      if (clientData.fotoFile) {
        fotoUrl = await storageService.uploadClientPhoto(clientData.fotoFile, tenantId)
      }

      // 2. Insertar cliente en 'veterinarias.clientes'
      const newClient = await clientsService.createClient({
        id_veterinaria: tenantId,
        nombres: clientData.nombres.trim().toUpperCase(),
        apellidos: clientData.apellidos.trim().toUpperCase(),
        numero_ci: clientData.numero_ci.trim() || null,
        telefono: clientData.telefono.trim(),
        email: clientData.email.trim() || null,
        foto_url: fotoUrl,
        password: null,
        fcm_token: null,
        depto: clientData.depto,
      })

      setCreatedClient(newClient)
      toast.success(`Cliente ${newClient.nombres} ${newClient.apellidos} registrado. Ahora ingresa los datos de su mascota.`)
      setCurrentStep(2)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'No se pudo registrar el cliente.', 'Error de Registro')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- PASO 2: Omitir Mascota (Finalizar solo con cliente) ---
  const handleSkipPatient = () => {
    toast.info('Registro finalizado. El propietario quedó registrado sin mascota.')
    handleResetAndClose()
    onSuccess()
  }

  // --- PASO 2: Guardado de Mascota y Vacunas ---
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createdClient) {
      toast.error('No se detectó un cliente activo para vincular a la mascota.')
      return
    }

    if (!patientData.nombre.trim()) {
      toast.warning('Por favor escribe el nombre de la mascota.')
      return
    }

    const especieFinal =
      patientData.especie === 'Otros'
        ? patientData.otraEspecie.trim()
        : patientData.especie

    if (!especieFinal) {
      toast.warning('Por favor especifica la especie de la mascota.')
      return
    }

    // Validar vacunas incompletas si agregó alguna fila
    for (let i = 0; i < patientData.vacunas.length; i++) {
      const vac = patientData.vacunas[i]
      if (!vac.nombre_vacuna.trim()) {
        toast.warning(`La vacuna #${i + 1} no tiene nombre asignado.`)
        return
      }
      if (vac.requiere_refuerzo === 'SI' && !vac.frecuencia?.trim()) {
        toast.warning(`Especifica la frecuencia de refuerzo para la vacuna ${vac.nombre_vacuna}.`)
        return
      }
    }

    try {
      setIsSubmitting(true)

      let fotoUrl: string | null = null

      // 1. Subir fotografía al bucket 'mascotas-fotos'
      if (patientData.fotoFile) {
        fotoUrl = await storageService.uploadPatientPhoto(patientData.fotoFile, tenantId)
      }

      // 2. Insertar paciente en 'veterinarias.mascotas'
      const newPatient = await patientsService.createPatient({
        id_veterinaria: tenantId,
        id_cliente: createdClient.id_cliente,
        nombre: patientData.nombre.trim(),
        especie: especieFinal,
        raza: patientData.raza.trim() || null,
        sexo: patientData.sexo,
        edad: patientData.edad ? parseInt(patientData.edad) : null,
        edad_meses: patientData.edad_meses ? parseInt(patientData.edad_meses) : null,
        fecha_nac: patientData.fecha_nac || null,
        peso: patientData.peso ? parseFloat(patientData.peso) : null,
        foto_url: fotoUrl,
        alertas: null,
        estado: 'ACTIVO',
      })

      // 3. Si hay vacunas en borrador, insertar lote en 'veterinarias.historial_vacunas'
      if (patientData.vacunas.length > 0) {
        const vaccineRecords = patientData.vacunas.map((vac) => ({
          id_veterinaria: tenantId,
          id_mascota: newPatient.id_mascota,
          nombre_vacuna: vac.nombre_vacuna,
          fecha: vac.fecha ? new Date(vac.fecha).toISOString() : new Date().toISOString(),
          dosis: vac.dosis || null,
          requiere_refuerzo: vac.requiere_refuerzo,
          frecuencia: vac.frecuencia || null,
          descripcion: vac.descripcion || null,
          estado: 'APLICADA',
        }))

        await vaccinesService.createVaccineBatch(vaccineRecords)
      }

      toast.success(
        `Paciente ${newPatient.nombre} registrado con éxito con ${patientData.vacunas.length} vacuna(s).`,
        'Alta Completa'
      )

      handleResetAndClose()
      onSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'No se pudo guardar la mascota o sus vacunas.', 'Error de Servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isSubmitting) {
            if (currentStep === 2 && createdClient) {
              if (
                window.confirm(
                  `El propietario ${createdClient.nombres} ya fue guardado en la base de datos (#${createdClient.id_cliente}). ¿Deseas salir sin registrar la mascota?`
                )
              ) {
                handleResetAndClose()
                onSuccess()
              }
            } else {
              handleResetAndClose()
            }
          }
        }}
      />

      {/* Ventana Flotante Centrada Dinámicamente */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-200">
        {/* Topbar del Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Alta de Propietario y Paciente
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Flujo clínico secuencial de registro estandarizado
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Header (Múltiplos de 4 en espaciado) */}
          <div className="px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-6 w-full">
              {/* Step 1 Indicator */}
              <div
                className={cn(
                  'flex items-center gap-3 flex-1 pb-1 transition-colors',
                  currentStep === 1
                    ? 'border-b-2 border-emerald-600'
                    : 'border-b-2 border-slate-200 opacity-60'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    createdClient
                      ? 'bg-emerald-600 text-white'
                      : currentStep === 1
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {createdClient ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    Paso 1: Propietario
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {createdClient ? 'Completado' : 'Datos del cliente'}
                  </span>
                </div>
              </div>

              {/* Step 2 Indicator */}
              <div
                className={cn(
                  'flex items-center gap-3 flex-1 pb-1 transition-colors',
                  currentStep === 2
                    ? 'border-b-2 border-emerald-600'
                    : 'border-b-2 border-slate-200 opacity-60'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    currentStep === 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  2
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    Paso 2: Paciente y Vacunas
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Ficha clínica inicial
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 1 ? (
              <form id="step-client-form" onSubmit={handleClientSubmit}>
                <StepClientForm
                  formData={clientData}
                  onChange={(updates) => setClientData({ ...clientData, ...updates })}
                  disabled={isSubmitting}
                />
              </form>
            ) : (
              <form id="step-patient-form" onSubmit={handlePatientSubmit}>
                <StepPatientForm
                  formData={patientData}
                  onChange={(updates) => setPatientData({ ...patientData, ...updates })}
                  clientName={`${createdClient?.nombres || ''} ${createdClient?.apellidos || ''}`.trim()}
                  clientId={createdClient?.id_cliente}
                  disabled={isSubmitting}
                />
              </form>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {currentStep === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAndClose}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  form="step-client-form"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2"
                >
                  {isSubmitting ? (
                    'Guardando Cliente...'
                  ) : (
                    <>
                      <span>Continuar a Ficha de Mascota</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipPatient}
                  disabled={isSubmitting}
                  className="text-xs text-slate-600 hover:text-slate-800"
                >
                  Omitir Mascota (Finalizar)
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    Ver Datos del Cliente
                  </Button>

                  <Button
                    type="submit"
                    form="step-patient-form"
                    size="sm"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 shadow-xs"
                  >
                    {isSubmitting ? (
                      'Guardando Paciente...'
                    ) : (
                      <>
                        <Dog className="w-4 h-4" />
                        <span>Guardar Mascota y Finalizar</span>
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
  )
}
