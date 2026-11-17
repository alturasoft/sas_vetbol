import { useState, useEffect } from 'react'
import {
  Activity,
  Weight,
  Thermometer,
  HeartPulse,
  Wind,
  Droplets,
  Eye,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'

interface RangeStatus {
  status: 'normal' | 'alert' | 'critical' | 'none'
  message?: string
}

function evaluateTemperature(val: number | null): RangeStatus {
  if (val === null || isNaN(val)) return { status: 'none' }
  if (val >= 38.0 && val <= 39.2) {
    return { status: 'normal', message: 'Rango fisiológico normal (38.0 - 39.2 °C)' }
  }
  if ((val >= 37.5 && val < 38.0) || (val > 39.2 && val <= 40.0)) {
    return { status: 'alert', message: 'Fuera del rango normal (Alerta)' }
  }
  return { status: 'critical', message: 'Valor crítico – verificar urgente (< 37.5 o > 40.0 °C)' }
}

function evaluateHeartRate(val: number | null): RangeStatus {
  if (val === null || isNaN(val)) return { status: 'none' }
  if (val >= 60 && val <= 160) {
    return { status: 'normal', message: 'Rango normal (60 - 160 lpm)' }
  }
  if ((val >= 40 && val < 60) || (val > 160 && val <= 200)) {
    return { status: 'alert', message: 'Frecuencia alterada (Alerta)' }
  }
  return { status: 'critical', message: 'FC Crítica (< 40 o > 200 lpm)' }
}

function evaluateRespRate(val: number | null): RangeStatus {
  if (val === null || isNaN(val)) return { status: 'none' }
  if (val >= 10 && val <= 30) {
    return { status: 'normal', message: 'Rango normal (10 - 30 rpm)' }
  }
  if ((val >= 8 && val < 10) || (val > 30 && val <= 50)) {
    return { status: 'alert', message: 'Frecuencia alterada (Alerta)' }
  }
  return { status: 'critical', message: 'FR Crítica (< 8 o > 50 rpm)' }
}

export function Paso2SignosVitales() {
  const { signosVitales, savePaso2SignosVitales, setStep, isSaving, error } =
    useConsultationWizardStore()

  const [peso, setPeso] = useState<string>('')
  const [temperatura, setTemperatura] = useState<string>('')
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState<string>('')
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState<string>('')
  const [presionArterial, setPresionArterial] = useState<string>('')
  const [hidratacion, setHidratacion] = useState<string>('Buena')
  const [mucosas, setMucosas] = useState<string>('Rosadas')
  const [condicionCorporal, setCondicionCorporal] = useState<number>(5)
  const [observaciones, setObservaciones] = useState<string>('')

  useEffect(() => {
    if (signosVitales) {
      setPeso(signosVitales.peso !== null && signosVitales.peso !== undefined ? String(signosVitales.peso) : '')
      setTemperatura(signosVitales.temperatura !== null && signosVitales.temperatura !== undefined ? String(signosVitales.temperatura) : '')
      setFrecuenciaCardiaca(signosVitales.frecuencia_cardiaca !== null && signosVitales.frecuencia_cardiaca !== undefined ? String(signosVitales.frecuencia_cardiaca) : '')
      setFrecuenciaRespiratoria(signosVitales.frecuencia_respiratoria !== null && signosVitales.frecuencia_respiratoria !== undefined ? String(signosVitales.frecuencia_respiratoria) : '')
      setPresionArterial(signosVitales.presion_arterial || '')
      setHidratacion(signosVitales.hidratacion || 'Buena')
      setMucosas(signosVitales.mucosas || 'Rosadas')
      setCondicionCorporal(signosVitales.condicion_corporal ? Number(signosVitales.condicion_corporal) : 5)
      setObservaciones(signosVitales.observaciones || '')
    }
  }, [signosVitales])

  // Parseadores y semáforos
  const numTemp = temperatura ? parseFloat(temperatura.replace(',', '.')) : null
  const numFC = frecuenciaCardiaca ? parseInt(frecuenciaCardiaca, 10) : null
  const numFR = frecuenciaRespiratoria ? parseInt(frecuenciaRespiratoria, 10) : null

  const tempEval = evaluateTemperature(numTemp)
  const fcEval = evaluateHeartRate(numFC)
  const frEval = evaluateRespRate(numFR)

  const getStatusBadge = (evaluation: RangeStatus) => {
    if (evaluation.status === 'normal') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {evaluation.message}
        </span>
      )
    }
    if (evaluation.status === 'alert') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {evaluation.message}
        </span>
      )
    }
    if (evaluation.status === 'critical') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-300 animate-bounce">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          {evaluation.message}
        </span>
      )
    }
    return null
  }

  // Interpretación de Condición Corporal (1-9)
  const getBcsInfo = (bcs: number) => {
    if (bcs <= 3) {
      return { label: 'Bajo peso / Desnutrido', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' }
    }
    if (bcs <= 6) {
      return { label: 'Peso ideal / Óptimo', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' }
    }
    return { label: 'Sobrepeso / Obeso', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' }
  }

  const bcsInfo = getBcsInfo(condicionCorporal)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedPeso = peso ? parseFloat(peso.replace(',', '.')) : null
    const parsedTemp = temperatura ? parseFloat(temperatura.replace(',', '.')) : null
    const parsedFC = frecuenciaCardiaca ? parseInt(frecuenciaCardiaca, 10) : null
    const parsedFR = frecuenciaRespiratoria ? parseInt(frecuenciaRespiratoria, 10) : null

    await savePaso2SignosVitales({
      peso: isNaN(Number(parsedPeso)) ? null : parsedPeso,
      temperatura: isNaN(Number(parsedTemp)) ? null : parsedTemp,
      frecuencia_cardiaca: isNaN(Number(parsedFC)) ? null : parsedFC,
      frecuencia_respiratoria: isNaN(Number(parsedFR)) ? null : parsedFR,
      presion_arterial: presionArterial.trim() || null,
      hidratacion,
      mucosas,
      condicion_corporal: String(condicionCorporal),
      observaciones: observaciones.trim() || null,
    })
  }

  return (
    <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Paso 2: Constantes y Signos Vitales (O - Objetivo Fisiológico)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Monitoreo fisiológico cuantitativo con semáforo de rangos clínicos en tiempo real
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Fila 1: Peso y Temperatura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Peso */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Weight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Peso Corporal (kg)
              </label>
              <input
                type="text"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ej: 14.5"
                className="w-full text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Permite cálculo posológico automático en el Paso 5
              </span>
            </div>

            {/* Temperatura */}
            <div className={`space-y-1.5 p-3 rounded-xl border transition-colors ${
              tempEval.status === 'critical'
                ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                : tempEval.status === 'alert'
                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Temperatura (°C)
                </label>
                {getStatusBadge(tempEval)}
              </div>
              <input
                type="text"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
                placeholder="Ej: 38.6"
                className="w-full text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Normal canino/felino: 38.0 a 39.2 °C
              </span>
            </div>
          </div>

          {/* Fila 2: FC y FR con Semáforo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Frecuencia Cardíaca */}
            <div className={`space-y-1.5 p-3 rounded-xl border transition-colors ${
              fcEval.status === 'critical'
                ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                : fcEval.status === 'alert'
                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  Frecuencia Cardíaca (lpm)
                </label>
                {getStatusBadge(fcEval)}
              </div>
              <input
                type="number"
                value={frecuenciaCardiaca}
                onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                placeholder="Ej: 110"
                className="w-full text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Rango fisiológico: 60 - 160 lpm
              </span>
            </div>

            {/* Frecuencia Respiratoria */}
            <div className={`space-y-1.5 p-3 rounded-xl border transition-colors ${
              frEval.status === 'critical'
                ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                : frEval.status === 'alert'
                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Wind className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Frecuencia Respiratoria (rpm)
                </label>
                {getStatusBadge(frEval)}
              </div>
              <input
                type="number"
                value={frecuenciaRespiratoria}
                onChange={(e) => setFrecuenciaRespiratoria(e.target.value)}
                placeholder="Ej: 22"
                className="w-full text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Rango fisiológico: 10 - 30 rpm
              </span>
            </div>
          </div>

          {/* Fila 3: Presión Arterial, Hidratación y Mucosas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Presión Arterial (mmHg)
              </label>
              <input
                type="text"
                value={presionArterial}
                onChange={(e) => setPresionArterial(e.target.value)}
                placeholder="Ej: 120/80"
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Hidratación
              </label>
              <select
                value={hidratacion}
                onChange={(e) => setHidratacion(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Buena" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Buena (Turgencia cutánea normal)</option>
                <option value="Regular" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Regular (Deshidratación 5-7%)</option>
                <option value="Mala" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Mala (Deshidratación &gt; 8%)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                Color de Mucosas
              </label>
              <select
                value={mucosas}
                onChange={(e) => setMucosas(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Rosadas" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Rosadas (Normocoloreadas)</option>
                <option value="Pálidas" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Pálidas (Anemia / Hipovolemia)</option>
                <option value="Cianóticas" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Cianóticas (Hipoxia grave)</option>
                <option value="Ictéricas" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Ictéricas (Fallo hepático/hemólisis)</option>
                <option value="Hiperémicas" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Hiperémicas (Sepsis / Fiebre)</option>
              </select>
            </div>
          </div>

          {/* Condición Corporal (Slider 1 a 9) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Condición Corporal (Escala 1 al 9)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{condicionCorporal} / 9</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${bcsInfo.color}`}>
                  {bcsInfo.label}
                </span>
              </div>
            </div>

            <input
              type="range"
              min="1"
              max="9"
              step="1"
              value={condicionCorporal}
              onChange={(e) => setCondicionCorporal(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1 font-semibold">
              <span>1 - Muy flaco</span>
              <span>3 - Delgado</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">5 - Ideal</span>
              <span>7 - Sobrepeso</span>
              <span>9 - Obesidad grave</span>
            </div>
          </div>

          {/* Observaciones de la exploración física */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Observaciones de Exploración Física
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Palpación ganglionar, auscultación cardíaca/pulmonar, tiempo de llenado capilar (TLLC), dolor abdominal, etc."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Footer de navegación */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="gap-2 text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Motivo</span>
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <span>{isSaving ? 'Guardando...' : 'Guardar Constantes & Siguiente'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
