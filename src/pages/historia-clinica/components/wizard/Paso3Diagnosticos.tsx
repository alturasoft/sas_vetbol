import { useState } from 'react'
import {
  Stethoscope,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import type { HistoriaDiagnosticos } from '@/types/medical-record.types'

const FREQUENT_DIAGNOSES = [
  'Gastroenteritis aguda',
  'Dermatitis alérgica',
  'Otitis externa',
  'Infección urinaria',
  'Anemia',
  'Parasitosis intestinal',
  'Rinitis viral',
  'Conjuntivitis',
  'Hipotermia',
  'Obesidad',
]

const SEVERITY_CONFIG: Record<string, { label: string; border: string; bg: string; text: string; badge: string }> = {
  LEVE: {
    label: 'Leve',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  MODERADO: {
    label: 'Moderado',
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  GRAVE: {
    label: 'Grave',
    border: 'border-l-rose-500',
    bg: 'bg-rose-50/40 dark:bg-rose-950/20',
    text: 'text-rose-700 dark:text-rose-400',
    badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  CRÍTICO: {
    label: 'Crítico',
    border: 'border-l-purple-600',
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    text: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
}

export function Paso3Diagnosticos() {
  const { diagnosticos, addDiagnostico, deleteDiagnostico, setStep, isSaving, error } =
    useConsultationWizardStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [diagnosticoTexto, setDiagnosticoTexto] = useState('')
  const [tipoDiagnostico, setTipoDiagnostico] = useState<'PRESUNTIVO' | 'DEFINITIVO'>('PRESUNTIVO')
  const [gravedad, setGravedad] = useState<string>('LEVE')
  const [codigoCieVet, setCodigoCieVet] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleOpenModalWithTemplate = (diagnosisName?: string) => {
    setDiagnosticoTexto(diagnosisName || '')
    setTipoDiagnostico('PRESUNTIVO')
    setGravedad('LEVE')
    setCodigoCieVet('')
    setObservaciones('')
    setIsModalOpen(true)
  }

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagnosticoTexto.trim()) return

    const success = await addDiagnostico({
      diagnostico: diagnosticoTexto.trim(),
      tipo_diagnostico: tipoDiagnostico,
      gravedad,
      codigo_cie_vet: codigoCieVet.trim() || null,
      observaciones: observaciones.trim() || null,
    })

    if (success) {
      setIsModalOpen(false)
      setDiagnosticoTexto('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    await deleteDiagnostico(deletingId)
    setDeletingId(null)
  }

  return (
    <>
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Paso 3: Diagnósticos (A - Análisis & Avalúo)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Diagnósticos presuntivos y definitivos con categorización de gravedad y CIE-Vet
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleOpenModalWithTemplate()}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Diagnóstico</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Chips frecuentes para autocompletar */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Diagnósticos Frecuentes (Clic para registrar):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENT_DIAGNOSES.map((diag) => (
                <button
                  key={diag}
                  type="button"
                  onClick={() => handleOpenModalWithTemplate(diag)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-750 transition-colors shadow-2xs font-medium"
                >
                  + {diag}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de diagnósticos registrados */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Diagnósticos Registrados ({diagnosticos.length})
            </h4>

            {diagnosticos.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No se han registrado diagnósticos para esta consulta.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Haz clic en "Nuevo Diagnóstico" o selecciona un chip rápido arriba.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {diagnosticos.map((diag: HistoriaDiagnosticos) => {
                  const severity = SEVERITY_CONFIG[diag.gravedad?.toUpperCase() || 'LEVE'] || SEVERITY_CONFIG.LEVE

                  return (
                    <div
                      key={diag.id_diagnostico}
                      className={`p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 border-l-4 ${severity.border} shadow-2xs flex items-start justify-between gap-4`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {diag.diagnostico}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${severity.badge}`}
                          >
                            {severity.label}
                          </span>
                          <Badge variant="outline" className="text-[10px] dark:border-slate-700 dark:text-slate-300">
                            {diag.tipo_diagnostico || 'PRESUNTIVO'}
                          </Badge>
                          {diag.codigo_cie_vet && (
                            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                              CIE: {diag.codigo_cie_vet}
                            </span>
                          )}
                        </div>

                        {diag.observaciones && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {diag.observaciones}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeletingId(diag.id_diagnostico)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Eliminar diagnóstico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Navegación */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="gap-2 text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Signos Vitales</span>
            </Button>

            <Button
              type="button"
              onClick={() => setStep(4)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <span>Continuar a Tratamientos (Plan)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Nuevo Diagnóstico */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Registrar Diagnóstico Clínico</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDiagnosis} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Diagnóstico <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={diagnosticoTexto}
                  onChange={(e) => setDiagnosticoTexto(e.target.value)}
                  placeholder="Ej: Gastroenteritis aguda bacteriana"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tipo de Diagnóstico
                  </label>
                  <select
                    value={tipoDiagnostico}
                    onChange={(e) => setTipoDiagnostico(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PRESUNTIVO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">PRESUNTIVO</option>
                    <option value="DEFINITIVO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">DEFINITIVO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Gravedad Clínica
                  </label>
                  <select
                    value={gravedad}
                    onChange={(e) => setGravedad(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LEVE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">LEVE (Verde)</option>
                    <option value="MODERADO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">MODERADO (Ámbar)</option>
                    <option value="GRAVE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">GRAVE (Rojo)</option>
                    <option value="CRÍTICO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">CRÍTICO (Púrpura)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Código CIE-Vet (Opcional)
                </label>
                <input
                  type="text"
                  value={codigoCieVet}
                  onChange={(e) => setCodigoCieVet(e.target.value)}
                  placeholder="Ej: K52.9"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Observaciones / Hallazgos Justificativos
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Datos diferenciales, respuesta al tacto o pruebas rápidas"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  {isSaving ? 'Guardando...' : 'Agregar Diagnóstico'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        variant="danger"
        title="Eliminar Diagnóstico"
        description="¿Estás seguro de que deseas eliminar este diagnóstico? La acción es inmediata."
        confirmText="Eliminar"
        cancelText="Conservar"
        isLoading={isSaving}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </>
  )
}
