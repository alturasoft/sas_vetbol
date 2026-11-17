import { create } from 'zustand'
import { medicalRecordsService } from '@/services/medical-records.service'
import { storageService } from '@/services/storage.service'
import { optimizeImage } from '@/lib/imageOptimization'
import { queryClient } from '@/lib/queryClient'
import type { MascotaConCliente } from '@/types/patient.types'

const invalidateMedicalRecordsCache = (idHistoria?: number | null) => {
  queryClient.invalidateQueries({ queryKey: ['medical-records'] })
  if (idHistoria) {
    queryClient.invalidateQueries({ queryKey: ['medical-record-detail', idHistoria] })
  }
}
import type {
  HistoriasClinicas,
  HistoriaSignosVitales,
  HistoriaDiagnosticos,
  HistoriaTratamientos,
  HistoriaRecetas,
  HistoriaExamenes,
  HistoriaArchivos,
  CreateDiagnosticoInput,
  CreateTratamientoInput,
  CreateRecetaInput,
  CreateExamenInput,
  UpsertSignosVitalesInput,
} from '@/types/medical-record.types'

interface ConsultationWizardState {
  // Estado del Wizard
  currentStep: number // 1 a 8
  maxStepReached: number
  isBlockedEPC: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Entidades clínicas
  mascota: MascotaConCliente | null
  historiaCreada: HistoriasClinicas | null
  signosVitales: HistoriaSignosVitales | null
  diagnosticos: HistoriaDiagnosticos[]
  tratamientos: HistoriaTratamientos[]
  recetas: HistoriaRecetas[]
  examenes: HistoriaExamenes[]
  archivos: HistoriaArchivos[]

  // Acciones de ciclo de vida
  initWizard: (mascota: MascotaConCliente) => void
  loadHistoria: (idHistoria: number) => Promise<boolean>
  setStep: (stepNumber: number) => void
  resetWizard: () => void

  // Acciones de Paso 1 (Motivo / Cabecera)
  savePaso1: (data: {
    tipo_consulta: string
    motivo_consulta: string
    anamnesis: string
    estado_general?: string
    observaciones?: string | null
    id_personal?: number | null
  }) => Promise<boolean>

  // Acciones de Paso 2 (Signos Vitales)
  savePaso2SignosVitales: (data: Omit<UpsertSignosVitalesInput, 'id_historia_clinica'>) => Promise<boolean>

  // Acciones de Paso 3 (Diagnósticos)
  addDiagnostico: (data: Omit<CreateDiagnosticoInput, 'id_historia_clinica'>) => Promise<boolean>
  deleteDiagnostico: (idDiagnostico: number) => Promise<boolean>

  // Acciones de Paso 4 (Tratamientos)
  addTratamiento: (data: Omit<CreateTratamientoInput, 'id_historia_clinica'>) => Promise<boolean>
  deleteTratamiento: (idTratamiento: number) => Promise<boolean>

  // Acciones de Paso 5 (Recetas)
  addReceta: (data: Omit<CreateRecetaInput, 'id_historia_clinica'>) => Promise<boolean>
  deleteReceta: (idReceta: number) => Promise<boolean>

  // Acciones de Paso 6 (Exámenes)
  addExamen: (data: Omit<CreateExamenInput, 'id_historia_clinica'>) => Promise<boolean>
  deleteExamen: (idExamen: number) => Promise<boolean>

  // Acciones de Paso 7 (Archivos)
  uploadArchivo: (
    file: File,
    metadata: {
      tipo_archivo: string
      observaciones?: string
    }
  ) => Promise<boolean>
  deleteArchivo: (idArchivo: number, urlArchivo?: string) => Promise<boolean>

  // Acciones de Paso 8 (Cierre)
  finalizarConsulta: () => Promise<boolean>
}

export const useConsultationWizardStore = create<ConsultationWizardState>((set, get) => ({
  currentStep: 1,
  maxStepReached: 1,
  isBlockedEPC: false,
  isLoading: false,
  isSaving: false,
  error: null,

  mascota: null,
  historiaCreada: null,
  signosVitales: null,
  diagnosticos: [],
  tratamientos: [],
  recetas: [],
  examenes: [],
  archivos: [],

  initWizard: (mascota: MascotaConCliente) => {
    // Guarda 1.3: Bloqueo estricto si mascota está en estado EPC (Eliminada Por Cliente)
    const isBlocked = mascota.estado === 'EPC'
    set({
      mascota,
      isBlockedEPC: isBlocked,
      currentStep: 1,
      maxStepReached: 1,
      historiaCreada: null,
      signosVitales: null,
      diagnosticos: [],
      tratamientos: [],
      recetas: [],
      examenes: [],
      archivos: [],
      error: isBlocked
        ? 'El paciente se encuentra en estado EPC (Eliminada por Cliente). Su expediente está bloqueado.'
        : null,
    })
  },

  loadHistoria: async (idHistoria: number): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null })
      const record = await medicalRecordsService.getMedicalRecordById(idHistoria)

      if (!record) {
        set({ isLoading: false, error: 'No se encontró la historia clínica especificada.' })
        return false
      }

      const mascota = (record.mascota as unknown as MascotaConCliente) || null
      const isBlocked = mascota?.estado === 'EPC'

      // Regla 1.2: Determinación del último paso donde se dejaron datos pendientes
      let resumeStep = 1
      if (record.estado === 'CERRADA' || (record.archivos && record.archivos.length > 0)) {
        resumeStep = 8
      } else if (record.examenes && record.examenes.length > 0) {
        resumeStep = 7
      } else if (record.recetas && record.recetas.length > 0) {
        resumeStep = 6
      } else if (record.tratamientos && record.tratamientos.length > 0) {
        resumeStep = 5
      } else if (record.diagnosticos && record.diagnosticos.length > 0) {
        resumeStep = 4
      } else if (record.signos_vitales) {
        resumeStep = 3
      } else if (record.id_historia_clinica) {
        resumeStep = 2
      }

      set({
        isLoading: false,
        mascota,
        isBlockedEPC: isBlocked,
        historiaCreada: record,
        signosVitales: record.signos_vitales || null,
        diagnosticos: record.diagnosticos || [],
        tratamientos: record.tratamientos || [],
        recetas: record.recetas || [],
        examenes: record.examenes || [],
        archivos: record.archivos || [],
        currentStep: resumeStep,
        maxStepReached: Math.max(resumeStep, 1),
      })

      return true
    } catch (err: any) {
      console.error('Error al hidratar historia clínica:', err)
      set({ isLoading: false, error: err.message || 'Error al cargar consulta' })
      return false
    }
  },

  setStep: (stepNumber: number) => {
    const { historiaCreada, isBlockedEPC, maxStepReached } = get()
    if (isBlockedEPC) return

    // Guarda 1.3: Dependencia Estricta del Paso 1
    if (stepNumber > 1 && !historiaCreada?.id_historia_clinica) {
      set({
        error: 'Debe guardar el Paso 1 (Motivo de Consulta) antes de acceder a los siguientes pasos.',
      })
      return
    }

    if (stepNumber >= 1 && stepNumber <= 8) {
      set({
        currentStep: stepNumber,
        maxStepReached: Math.max(maxStepReached, stepNumber),
        error: null,
      })
    }
  },

  resetWizard: () => {
    set({
      currentStep: 1,
      maxStepReached: 1,
      isBlockedEPC: false,
      isLoading: false,
      isSaving: false,
      error: null,
      mascota: null,
      historiaCreada: null,
      signosVitales: null,
      diagnosticos: [],
      tratamientos: [],
      recetas: [],
      examenes: [],
      archivos: [],
    })
  },

  savePaso1: async (data): Promise<boolean> => {
    const { mascota, historiaCreada } = get()
    if (!mascota) {
      set({ error: 'No hay paciente seleccionado para registrar la consulta.' })
      return false
    }

    try {
      set({ isSaving: true, error: null })

      let savedRecord: HistoriasClinicas

      if (!historiaCreada?.id_historia_clinica) {
        // INSERT Inicial
        savedRecord = await medicalRecordsService.createHistoriaCabecera({
          id_veterinaria: mascota.id_veterinaria,
          id_mascota: mascota.id_mascota,
          id_cliente: mascota.id_cliente,
          id_personal: data.id_personal,
          tipo_consulta: data.tipo_consulta,
          motivo_consulta: data.motivo_consulta,
          anamnesis: data.anamnesis,
          estado_general: data.estado_general || 'BUENO',
          observaciones: data.observaciones,
          estado: 'ABIERTA',
        })
      } else {
        // UPDATE
        savedRecord = await medicalRecordsService.updateHistoriaCabecera(
          historiaCreada.id_historia_clinica,
          {
            tipo_consulta: data.tipo_consulta,
            motivo_consulta: data.motivo_consulta,
            anamnesis: data.anamnesis,
            estado_general: data.estado_general,
            observaciones: data.observaciones,
          }
        )
      }

      set((state) => ({
        isSaving: false,
        historiaCreada: savedRecord,
        currentStep: 2,
        maxStepReached: Math.max(state.maxStepReached, 2),
      }))

      invalidateMedicalRecordsCache(savedRecord.id_historia_clinica)

      return true
    } catch (err: any) {
      console.error('Error al guardar Paso 1:', err)
      set({ isSaving: false, error: err.message || 'Error al guardar motivo de consulta' })
      return false
    }
  },

  savePaso2SignosVitales: async (data): Promise<boolean> => {
    const { historiaCreada } = get()
    if (!historiaCreada?.id_historia_clinica) {
      set({ error: 'Falta cabecera de historia clínica.' })
      return false
    }

    try {
      set({ isSaving: true, error: null })
      const saved = await medicalRecordsService.upsertSignosVitales({
        id_historia_clinica: historiaCreada.id_historia_clinica,
        ...data,
      })

      set((state) => ({
        isSaving: false,
        signosVitales: saved,
        currentStep: 3,
        maxStepReached: Math.max(state.maxStepReached, 3),
      }))

      invalidateMedicalRecordsCache(historiaCreada.id_historia_clinica)

      return true
    } catch (err: any) {
      console.error('Error al guardar signos vitales:', err)
      set({ isSaving: false, error: err.message || 'Error al guardar signos vitales' })
      return false
    }
  },

  addDiagnostico: async (data): Promise<boolean> => {
    const { historiaCreada } = get()
    if (!historiaCreada?.id_historia_clinica) return false

    try {
      set({ isSaving: true, error: null })
      const created = await medicalRecordsService.addDiagnostico({
        id_historia_clinica: historiaCreada.id_historia_clinica,
        ...data,
      })

      set((state) => ({
        isSaving: false,
        diagnosticos: [...state.diagnosticos, created],
      }))
      invalidateMedicalRecordsCache(historiaCreada.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al agregar diagnóstico:', err)
      set({ isSaving: false, error: err.message || 'Error al agregar diagnóstico' })
      return false
    }
  },

  deleteDiagnostico: async (idDiagnostico: number): Promise<boolean> => {
    try {
      set({ isSaving: true, error: null })
      await medicalRecordsService.deleteDiagnostico(idDiagnostico)
      set((state) => ({
        isSaving: false,
        diagnosticos: state.diagnosticos.filter((d) => d.id_diagnostico !== idDiagnostico),
      }))
      invalidateMedicalRecordsCache(get().historiaCreada?.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al eliminar diagnóstico:', err)
      set({ isSaving: false, error: err.message || 'Error al eliminar diagnóstico' })
      return false
    }
  },

  addTratamiento: async (data): Promise<boolean> => {
    const { historiaCreada } = get()
    if (!historiaCreada?.id_historia_clinica) return false

    try {
      set({ isSaving: true, error: null })
      const created = await medicalRecordsService.addTratamiento({
        id_historia_clinica: historiaCreada.id_historia_clinica,
        ...data,
      })

      set((state) => ({
        isSaving: false,
        tratamientos: [...state.tratamientos, created],
      }))
      invalidateMedicalRecordsCache(historiaCreada.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al agregar tratamiento:', err)
      set({ isSaving: false, error: err.message || 'Error al agregar tratamiento' })
      return false
    }
  },

  deleteTratamiento: async (idTratamiento: number): Promise<boolean> => {
    try {
      set({ isSaving: true, error: null })
      await medicalRecordsService.deleteTratamiento(idTratamiento)
      set((state) => ({
        isSaving: false,
        tratamientos: state.tratamientos.filter((t) => t.id_tratamiento !== idTratamiento),
      }))
      invalidateMedicalRecordsCache(get().historiaCreada?.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al eliminar tratamiento:', err)
      set({ isSaving: false, error: err.message || 'Error al eliminar tratamiento' })
      return false
    }
  },

  addReceta: async (data): Promise<boolean> => {
    const { historiaCreada } = get()
    if (!historiaCreada?.id_historia_clinica) return false

    try {
      set({ isSaving: true, error: null })
      const created = await medicalRecordsService.addReceta({
        id_historia_clinica: historiaCreada.id_historia_clinica,
        ...data,
      })

      set((state) => ({
        isSaving: false,
        recetas: [...state.recetas, created],
      }))
      invalidateMedicalRecordsCache(historiaCreada.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al agregar receta:', err)
      set({ isSaving: false, error: err.message || 'Error al agregar receta' })
      return false
    }
  },

  deleteReceta: async (idReceta: number): Promise<boolean> => {
    try {
      set({ isSaving: true, error: null })
      await medicalRecordsService.deleteReceta(idReceta)
      set((state) => ({
        isSaving: false,
        recetas: state.recetas.filter((r) => r.id_receta !== idReceta),
      }))
      invalidateMedicalRecordsCache(get().historiaCreada?.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al eliminar receta:', err)
      set({ isSaving: false, error: err.message || 'Error al eliminar receta' })
      return false
    }
  },

  addExamen: async (data): Promise<boolean> => {
    const { historiaCreada } = get()
    if (!historiaCreada?.id_historia_clinica) return false

    try {
      set({ isSaving: true, error: null })
      const created = await medicalRecordsService.addExamen({
        id_historia_clinica: historiaCreada.id_historia_clinica,
        ...data,
      })

      set((state) => ({
        isSaving: false,
        examenes: [...state.examenes, created],
      }))
      invalidateMedicalRecordsCache(historiaCreada.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al agregar examen:', err)
      set({ isSaving: false, error: err.message || 'Error al agregar examen' })
      return false
    }
  },

  deleteExamen: async (idExamen: number): Promise<boolean> => {
    try {
      set({ isSaving: true, error: null })
      await medicalRecordsService.deleteExamen(idExamen)
      set((state) => ({
        isSaving: false,
        examenes: state.examenes.filter((e) => e.id_examen !== idExamen),
      }))
      invalidateMedicalRecordsCache(get().historiaCreada?.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al eliminar examen:', err)
      set({ isSaving: false, error: err.message || 'Error al eliminar examen' })
      return false
    }
  },

  uploadArchivo: async (file, metadata): Promise<boolean> => {
    const { mascota, historiaCreada } = get()
    if (!mascota || !historiaCreada?.id_historia_clinica) return false

    try {
      set({ isSaving: true, error: null })

      let fileToUpload: File = file
      let ext = file.name.split('.').pop() || 'dat'

      // Pipeline de optimización WebP para imágenes
      if (file.type.startsWith('image/')) {
        try {
          const optimized = await optimizeImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.82,
            format: 'image/webp',
          })
          fileToUpload = optimized.file
          ext = 'webp'
        } catch (optErr) {
          console.warn('Fallo en optimización WebP, subiendo original:', optErr)
        }
      }

      // Subida a Supabase Storage bucket 'historias-clinicas'
      const publicUrl = await storageService.uploadMedicalRecordFile(
        fileToUpload,
        mascota.id_veterinaria,
        mascota.id_mascota,
        historiaCreada.id_historia_clinica,
        ext,
        fileToUpload.type
      )

      // Inserción en tabla veterinarias.historia_archivos
      const created = await medicalRecordsService.addArchivo({
        id_historia_clinica: historiaCreada.id_historia_clinica,
        tipo_archivo: metadata.tipo_archivo,
        nombre_archivo: file.name,
        url_archivo: publicUrl,
        extension: ext,
        tamano_kb: Math.round(fileToUpload.size / 1024),
        observaciones: metadata.observaciones || null,
      })

      set((state) => ({
        isSaving: false,
        archivos: [...state.archivos, created],
      }))
      invalidateMedicalRecordsCache(historiaCreada.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al subir archivo clínico:', err)
      set({ isSaving: false, error: err.message || 'Error al subir archivo' })
      return false
    }
  },

  deleteArchivo: async (idArchivo: number, urlArchivo?: string): Promise<boolean> => {
    try {
      set({ isSaving: true, error: null })
      await medicalRecordsService.deleteArchivo(idArchivo, urlArchivo)
      set((state) => ({
        isSaving: false,
        archivos: state.archivos.filter((a) => a.id_archivo !== idArchivo),
      }))
      invalidateMedicalRecordsCache(get().historiaCreada?.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al eliminar archivo clínico:', err)
      set({ isSaving: false, error: err.message || 'Error al eliminar archivo' })
      return false
    }
  },

  finalizarConsulta: async (): Promise<boolean> => {
    const { historiaCreada } = get()
    if (!historiaCreada?.id_historia_clinica) return false

    try {
      set({ isSaving: true, error: null })
      const finalized = await medicalRecordsService.finalizarConsulta(
        historiaCreada.id_historia_clinica
      )

      set({
        isSaving: false,
        historiaCreada: finalized,
      })
      invalidateMedicalRecordsCache(historiaCreada.id_historia_clinica)
      return true
    } catch (err: any) {
      console.error('Error al finalizar consulta médica:', err)
      set({ isSaving: false, error: err.message || 'Error al finalizar consulta' })
      return false
    }
  },
}))
