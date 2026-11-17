import { useState, useEffect } from 'react'
import { FileText, Mic, MicOff, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import { useAuthStore } from '@/stores/useAuthStore'

const QUICK_SYMPTOMS = [
  'Vómitos',
  'Diarrea',
  'Fiebre',
  'Tos',
  'Inapetencia',
  'Decaimiento',
]

const CONSULTATION_TYPES = [
  'Consulta General',
  'Urgencia',
  'Control',
  'Cirugía',
  'Especialidad',
]

const GENERAL_STATUSES = [
  { value: 'BUENO', label: 'Bueno (Alerta, responde a estímulos)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'REGULAR', label: 'Regular (Letárgico, respuesta disminuida)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'MALO', label: 'Malo (Deprimido, estuporoso)', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { value: 'CRITICO', label: 'Crítico (Comatoso, shock)', color: 'text-purple-700 bg-purple-50 border-purple-200' },
]

export function Paso1Motivo() {
  const { historiaCreada, savePaso1, isSaving, error } = useConsultationWizardStore()
  const { user } = useAuthStore()

  const [tipoConsulta, setTipoConsulta] = useState('Consulta General')
  const [motivoConsulta, setMotivoConsulta] = useState('')
  const [anamnesis, setAnamnesis] = useState('')
  const [estadoGeneral, setEstadoGeneral] = useState('BUENO')
  const [observaciones, setObservaciones] = useState('')

  const [isListeningMotivo, setIsListeningMotivo] = useState(false)
  const [isListeningAnamnesis, setIsListeningAnamnesis] = useState(false)

  // Cargar datos previos si existen
  useEffect(() => {
    if (historiaCreada) {
      setTipoConsulta(historiaCreada.tipo_consulta || 'Consulta General')
      setMotivoConsulta(historiaCreada.motivo_consulta || '')
      setAnamnesis(historiaCreada.anamnesis || '')
      setEstadoGeneral(historiaCreada.estado_general || 'BUENO')
      setObservaciones(historiaCreada.observaciones || '')
    }
  }, [historiaCreada])

  // One-touch symptom chip click
  const handleAddSymptom = (symptom: string) => {
    setMotivoConsulta((prev) => {
      const trimmed = prev.trim()
      if (!trimmed) return symptom
      const parts = trimmed.split(',').map((s) => s.trim().toLowerCase())
      if (parts.includes(symptom.toLowerCase())) return prev
      return `${trimmed}, ${symptom}`
    })
  }

  // Web Speech API Voice Dictation helper
  const handleToggleDictation = (field: 'motivo' | 'anamnesis') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('El reconocimiento de voz no está soportado en este navegador. Utiliza Google Chrome o Edge.')
      return
    }

    if (field === 'motivo') {
      if (isListeningMotivo) {
        setIsListeningMotivo(false)
        return
      }
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = 'es-BO'
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onstart = () => setIsListeningMotivo(true)
        recognition.onend = () => setIsListeningMotivo(false)
        recognition.onerror = () => setIsListeningMotivo(false)
        recognition.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript
          setMotivoConsulta((prev) => (prev ? `${prev} ${transcript}` : transcript))
          setIsListeningMotivo(false)
        }
        recognition.start()
      } catch (e) {
        setIsListeningMotivo(false)
      }
    } else {
      if (isListeningAnamnesis) {
        setIsListeningAnamnesis(false)
        return
      }
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = 'es-BO'
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onstart = () => setIsListeningAnamnesis(true)
        recognition.onend = () => setIsListeningAnamnesis(false)
        recognition.onerror = () => setIsListeningAnamnesis(false)
        recognition.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript
          setAnamnesis((prev) => (prev ? `${prev} ${transcript}` : transcript))
          setIsListeningAnamnesis(false)
        }
        recognition.start()
      } catch (e) {
        setIsListeningAnamnesis(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivoConsulta.trim() || !anamnesis.trim()) {
      alert('Por favor completa los campos requeridos: Motivo de consulta y Anamnesis.')
      return
    }

    await savePaso1({
      tipo_consulta: tipoConsulta,
      motivo_consulta: motivoConsulta.trim(),
      anamnesis: anamnesis.trim(),
      estado_general: estadoGeneral,
      observaciones: observaciones.trim() || null,
      id_personal: user?.id_persona || null,
    })
  }

  return (
    <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Paso 1: Motivo de Consulta & Anamnesis (S - Subjetivo)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Registra la razón de atención relatada por el tutor y la historia de los síntomas
              </CardDescription>
            </div>
          </div>

          {historiaCreada?.id_historia_clinica && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>N° {historiaCreada.numero_historia || `#${historiaCreada.id_historia_clinica}`}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Tipo de consulta y Estado general */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tipo de Consulta <span className="text-rose-500">*</span>
              </label>
              <select
                value={tipoConsulta}
                onChange={(e) => setTipoConsulta(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CONSULTATION_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Estado General Inicial
              </label>
              <select
                value={estadoGeneral}
                onChange={(e) => setEstadoGeneral(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {GENERAL_STATUSES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chips de Síntomas Rápidos (One-Touch) */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Síntomas Rápidos (One-Touch para autocompletar):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SYMPTOMS.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleAddSymptom(symptom)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-750 transition-colors shadow-2xs font-medium"
                >
                  + {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* Motivo de Consulta con Dictado */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Motivo de Consulta <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => handleToggleDictation('motivo')}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                  isListeningMotivo
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 animate-pulse font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Dictado por voz"
              >
                {isListeningMotivo ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                <span>{isListeningMotivo ? 'Escuchando...' : 'Dictar por voz'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              placeholder="Ej: Presenta vómitos biliosos desde anoche, decaimiento e inapetencia..."
              required
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Anamnesis / Historia Previa con Dictado */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Anamnesis (Historia clínica narrada por el tutor) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => handleToggleDictation('anamnesis')}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                  isListeningAnamnesis
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 animate-pulse font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Dictado por voz"
              >
                {isListeningAnamnesis ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                <span>{isListeningAnamnesis ? 'Escuchando...' : 'Dictar por voz'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={anamnesis}
              onChange={(e) => setAnamnesis(e.target.value)}
              placeholder="Cronología de signos, alimentación habitual, último consumo de agua, ingesta accidental de cuerpos extraños o plantas, convivencia con otros animales..."
              required
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Observaciones Generales */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Observaciones Adicionales (Opcional)
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas preliminares, temperamento del paciente en sala de espera, etc."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Footer con persistencia y botón de avance */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              * Al guardar, se generará el registro oficial en estado <strong className="text-emerald-700 dark:text-emerald-400">ABIERTA</strong>.
            </p>

            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <span>{isSaving ? 'Guardando...' : historiaCreada ? 'Guardar Cambios & Siguiente' : 'Generar Consulta & Siguiente'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
