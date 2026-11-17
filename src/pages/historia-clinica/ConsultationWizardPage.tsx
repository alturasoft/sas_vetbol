import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  ArrowLeft,
  Dog,
  User,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { WizardStepper } from './components/wizard/WizardStepper'
import { Paso1Motivo } from './components/wizard/Paso1Motivo'
import { Paso2SignosVitales } from './components/wizard/Paso2SignosVitales'
import { Paso3Diagnosticos } from './components/wizard/Paso3Diagnosticos'
import { Paso4Tratamientos } from './components/wizard/Paso4Tratamientos'
import { Paso5Recetas } from './components/wizard/Paso5Recetas'
import { Paso6Examenes } from './components/wizard/Paso6Examenes'
import { Paso7Archivos } from './components/wizard/Paso7Archivos'
import { Paso8Finalizacion } from './components/wizard/Paso8Finalizacion'
import { PatientSelectModal } from './components/PatientSelectModal'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import { patientsService } from '@/services/patients.service'
import { queryClient } from '@/lib/queryClient'
import type { MascotaConCliente } from '@/types/patient.types'

export function ConsultationWizardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const idMascotaParam = searchParams.get('idMascota')
  const idHistoriaParam = searchParams.get('idHistoria')

  const {
    currentStep,
    maxStepReached,
    isBlockedEPC,
    isLoading,
    mascota,
    historiaCreada,
    signosVitales,
    initWizard,
    loadHistoria,
    setStep,
    resetWizard,
  } = useConsultationWizardStore()

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      setIsInitializing(true)

      // 1. Si viene con idHistoria, hidratar la consulta existente y restaurar paso
      if (idHistoriaParam) {
        const idHistoria = parseInt(idHistoriaParam, 10)
        if (!isNaN(idHistoria)) {
          await loadHistoria(idHistoria)
          if (isMounted) setIsInitializing(false)
          return
        }
      }

      // 2. Si viene con idMascota pero sin idHistoria, inicializar nueva consulta para esa mascota
      if (idMascotaParam) {
        const idMascota = parseInt(idMascotaParam, 10)
        if (!isNaN(idMascota)) {
          try {
            const patientData = await patientsService.getPatientById(idMascota)
            if (patientData && isMounted) {
              initWizard(patientData)
              setIsInitializing(false)
              return
            }
          } catch (e) {
            console.error('Error al cargar paciente para consulta:', e)
          }
        }
      }

      // 3. Si no hay parámetros ni paciente en memoria, abrir selector
      if (!mascota && isMounted) {
        setIsPatientModalOpen(true)
      }

      if (isMounted) setIsInitializing(false)
    }

    initialize()

    return () => {
      isMounted = false
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })
    }
  }, [idHistoriaParam, idMascotaParam])

  const handleBackToList = () => {
    queryClient.invalidateQueries({ queryKey: ['medical-records'] })
    navigate('/historia-clinica')
  }

  const handleSelectPatientFromModal = (selected: MascotaConCliente) => {
    setIsPatientModalOpen(false)
    initWizard(selected)
    setSearchParams({ idMascota: String(selected.id_mascota) })
  }

  // Vista restrictiva si la mascota está en estado EPC (Guarda 1.3)
  if (isBlockedEPC || mascota?.estado === 'EPC') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Acceso Restringido: Paciente en Estado EPC
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
          El paciente <strong className="text-slate-900 dark:text-slate-100">{mascota?.nombre}</strong> ha sido dado de baja
          por el cliente (Estado EPC). El sistema prohíbe la apertura de nuevas consultas o la modificación de expedientes clínicos para registros inactivos.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToList}
            className="text-xs gap-1.5 dark:border-slate-800 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Historias Clínicas</span>
          </Button>
          <Button
            type="button"
            onClick={() => {
              resetWizard()
              setIsPatientModalOpen(true)
            }}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Seleccionar Otra Mascota
          </Button>
        </div>
      </div>
    )
  }

  if (isInitializing || isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cargando expediente clínico...</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">Verificando constantes y recuperando datos del SOAP</p>
      </div>
    )
  }

  const client = mascota?.cliente
  const ownerFullName = client ? `${client.nombres || ''} ${client.apellidos || ''}`.trim() : 'Sin tutor asignado'

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Principal con Ficha Rápida del Paciente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBackToList}
            className="h-9 px-2.5 text-xs gap-1 border-slate-200 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Volver al listado"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Listado</span>
          </Button>

          {mascota ? (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={mascota.foto_url || undefined}
                fallback={mascota.nombre}
                className="w-11 h-11 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
                    {mascota.nombre}
                  </h1>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 dark:border-slate-700 dark:text-slate-300">
                    {mascota.especie} {mascota.raza ? `• ${mascota.raza}` : ''}
                  </Badge>
                  {historiaCreada?.estado && (
                    <Badge
                      className={`text-[10px] font-bold ${
                        historiaCreada.estado === 'CERRADA'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {historiaCreada.estado}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    {ownerFullName}
                  </span>
                  {signosVitales?.peso && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      • {signosVitales.peso} kg
                    </span>
                  )}
                  {historiaCreada?.numero_historia && (
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                      • {historiaCreada.numero_historia}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Nueva Consulta SOAP</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona un paciente para comenzar</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPatientModalOpen(true)}
            className="text-xs gap-1.5 h-9 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Dog className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{mascota ? 'Cambiar Paciente' : 'Seleccionar Paciente'}</span>
          </Button>
        </div>
      </div>

      {/* Stepper de 8 Pasos */}
      <WizardStepper
        currentStep={currentStep}
        maxStepReached={maxStepReached}
        isBlockedEPC={isBlockedEPC}
        hasHeaderCreated={!!historiaCreada?.id_historia_clinica}
        onSelectStep={(step) => setStep(step)}
      />

      {/* Cuerpo del Paso Actual */}
      {currentStep === 1 && <Paso1Motivo />}
      {currentStep === 2 && <Paso2SignosVitales />}
      {currentStep === 3 && <Paso3Diagnosticos />}
      {currentStep === 4 && <Paso4Tratamientos />}
      {currentStep === 5 && <Paso5Recetas />}
      {currentStep === 6 && <Paso6Examenes />}
      {currentStep === 7 && <Paso7Archivos />}
      {currentStep === 8 && <Paso8Finalizacion />}

      {/* Modal de selección de paciente */}
      <PatientSelectModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false)
          if (!mascota) navigate('/historia-clinica')
        }}
        onSelectPatient={handleSelectPatientFromModal}
      />
    </div>
  )
}
