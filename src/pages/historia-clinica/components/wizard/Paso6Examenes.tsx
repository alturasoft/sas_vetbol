import { useState } from 'react'
import {
  FlaskConical,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import type { HistoriaExamenes } from '@/types/medical-record.types'

const QUICK_EXAMS = [
  'Hemograma completo',
  'Bioquímica sérica',
  'Urianálisis',
  'Radiografía tórax',
  'Ecografía abdominal',
  'Cultivo y sensibilidad',
  'Citología',
  'Electrocardiograma',
  'Coprológico',
  'PCR / Serología',
]

export function Paso6Examenes() {
  const { examenes, addExamen, deleteExamen, setStep, isSaving, error } =
    useConsultationWizardStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tipoExamen, setTipoExamen] = useState('')
  const [resultado, setResultado] = useState('')
  const [laboratorio, setLaboratorio] = useState('')
  const [fechaExamen, setFechaExamen] = useState(new Date().toISOString().split('T')[0])
  const [observaciones, setObservaciones] = useState('')

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleOpenWithExam = (examName?: string) => {
    setTipoExamen(examName || '')
    setResultado('')
    setLaboratorio('')
    setFechaExamen(new Date().toISOString().split('T')[0])
    setObservaciones('')
    setIsModalOpen(true)
  }

  const handleSaveExamen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tipoExamen.trim()) return

    const success = await addExamen({
      tipo_examen: tipoExamen.trim(),
      resultado: resultado.trim() || null,
      laboratorio: laboratorio.trim() || null,
      fecha_examen: fechaExamen ? new Date(fechaExamen).toISOString() : new Date().toISOString(),
      observaciones: observaciones.trim() || null,
    })

    if (success) {
      setIsModalOpen(false)
      setTipoExamen('')
      setResultado('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    await deleteExamen(deletingId)
    setDeletingId(null)
  }

  return (
    <>
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Paso 6: Exámenes Complementarios (O - Objetivo Laboratorio / Imagen)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Órdenes de análisis clínico, radiografías, ecografías y registros de resultados
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleOpenWithExam()}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Solicitar Examen</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Catálogo Rápido de Exámenes */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Catálogo Rápido de Pruebas Frecuentes:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EXAMS.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => handleOpenWithExam(exam)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-750 transition-colors shadow-2xs font-medium"
                >
                  + {exam}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Exámenes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Exámenes Complementarios ({examenes.length})
            </h4>

            {examenes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No se han solicitado pruebas de laboratorio ni imagenología en esta consulta.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Puedes seleccionar una prueba rápida o hacer clic en "Solicitar Examen".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {examenes.map((e: HistoriaExamenes) => (
                  <div
                    key={e.id_examen}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs flex items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{e.tipo_examen}</span>

                        {e.resultado ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Resultado Registrado
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800">
                            Pendiente de Resultados
                          </Badge>
                        )}

                        {e.laboratorio && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                            <Building className="w-3 h-3 text-slate-400" />
                            {e.laboratorio}
                          </span>
                        )}

                        {e.fecha_examen && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(e.fecha_examen).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {e.resultado && (
                        <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                          <strong className="block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                            Hallazgos / Resultados:
                          </strong>
                          <p className="leading-relaxed whitespace-pre-wrap">{e.resultado}</p>
                        </div>
                      )}

                      {e.observaciones && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pl-1">
                          Obs: {e.observaciones}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingId(e.id_examen)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar examen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navegación */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(5)}
              className="gap-2 text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Recetas</span>
            </Button>

            <Button
              type="button"
              onClick={() => setStep(7)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <span>Continuar a Archivos Multimedia</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Crear Examen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Solicitar / Registrar Examen</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExamen} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tipo de Examen o Estudio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tipoExamen}
                  onChange={(e) => setTipoExamen(e.target.value)}
                  placeholder="Ej: Hemograma completo, Radiografía de cadera..."
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Laboratorio / Centro Externo
                  </label>
                  <input
                    type="text"
                    value={laboratorio}
                    onChange={(e) => setLaboratorio(e.target.value)}
                    placeholder="Ej: Laboratorio Central, In-house..."
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha del Estudio
                  </label>
                  <input
                    type="date"
                    value={fechaExamen}
                    onChange={(e) => setFechaExamen(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Resultados / Hallazgos (Si ya están disponibles)
                </label>
                <textarea
                  rows={3}
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value)}
                  placeholder="Valores relevantes, leucocitosis, anemia, hallazgos radiográficos, etc."
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Observaciones Adicionales
                </label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Muestra tomada en ayunas"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  {isSaving ? 'Guardando...' : 'Registrar Examen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        variant="danger"
        title="Eliminar Examen"
        description="¿Confirmas la eliminación de este examen complementario?"
        confirmText="Eliminar"
        cancelText="Conservar"
        isLoading={isSaving}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </>
  )
}
