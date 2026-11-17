import { useState } from 'react'
import {
  ClipboardList,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import type { HistoriaTratamientos } from '@/types/medical-record.types'

const QUICK_TEMPLATES = [
  {
    titulo: 'Fluidoterapia IV',
    indicaciones: 'Solución Ringer Lactato 10 ml/kg/h',
    duracion: 1,
  },
  {
    titulo: 'Reposo relativo',
    indicaciones: 'Evitar esfuerzo físico por el tiempo indicado',
    duracion: 7,
  },
  {
    titulo: 'Dieta blanda',
    indicaciones: 'Arroz con pollo hervido, sin sal',
    duracion: 5,
  },
  {
    titulo: 'Baño medicado',
    indicaciones: 'Baño antiséptico cada 3 días',
    duracion: 10,
  },
  {
    titulo: 'Control en 7 días',
    indicaciones: 'Revisión y reevaluación médica post-tratamiento',
    duracion: 7,
  },
]

export function Paso4Tratamientos() {
  const { tratamientos, addTratamiento, deleteTratamiento, setStep, isSaving, error } =
    useConsultationWizardStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tratamiento, setTratamiento] = useState('')
  const [indicaciones, setIndicaciones] = useState('')
  const [duracionDias, setDuracionDias] = useState<string>('')
  const [estado, setEstado] = useState<string>('ACTIVO')

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleOpenWithTemplate = (tmpl?: { titulo: string; indicaciones: string; duracion?: number }) => {
    if (tmpl) {
      setTratamiento(tmpl.titulo)
      setIndicaciones(tmpl.indicaciones)
      setDuracionDias(tmpl.duracion ? String(tmpl.duracion) : '')
    } else {
      setTratamiento('')
      setIndicaciones('')
      setDuracionDias('')
    }
    setEstado('ACTIVO')
    setIsModalOpen(true)
  }

  const handleSaveTratamiento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tratamiento.trim()) return

    const parsedDias = duracionDias ? parseInt(duracionDias, 10) : null

    const success = await addTratamiento({
      tratamiento: tratamiento.trim(),
      indicaciones: indicaciones.trim() || null,
      duracion_dias: isNaN(Number(parsedDias)) ? null : parsedDias,
      estado,
    })

    if (success) {
      setIsModalOpen(false)
      setTratamiento('')
      setIndicaciones('')
      setDuracionDias('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    await deleteTratamiento(deletingId)
    setDeletingId(null)
  }

  return (
    <>
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Paso 4: Plan Terapéutico & Procedimientos (P - Plan)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Tratamientos inmediatos en clínica, cuidados ambulatorios y pautas de manejo
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleOpenWithTemplate()}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Tratamiento</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Plantillas Rápidas Predefinidas */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Plantillas Rápidas (Un clic para cargar):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.titulo}
                  type="button"
                  onClick={() => handleOpenWithTemplate(tmpl)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-750 transition-colors shadow-2xs text-left"
                >
                  <span className="font-bold block">+ {tmpl.titulo}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-[200px]">
                    {tmpl.indicaciones}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Tratamientos Registrados */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tratamientos Registrados ({tratamientos.length})
            </h4>

            {tratamientos.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No se han registrado procedimientos ni tratamientos para esta consulta.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Puedes utilizar las plantillas rápidas o hacer clic en "Nuevo Tratamiento".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {tratamientos.map((t: HistoriaTratamientos) => (
                  <div
                    key={t.id_tratamiento}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.tratamiento}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            t.estado === 'ACTIVO'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : t.estado === 'COMPLETADO'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {t.estado || 'ACTIVO'}
                        </Badge>
                        {t.duracion_dias !== null && t.duracion_dias !== undefined && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {t.duracion_dias} {t.duracion_dias === 1 ? 'día' : 'días'}
                          </span>
                        )}
                      </div>

                      {t.indicaciones && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                          {t.indicaciones}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingId(t.id_tratamiento)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar tratamiento"
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
              onClick={() => setStep(3)}
              className="gap-2 text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Diagnósticos</span>
            </Button>

            <Button
              type="button"
              onClick={() => setStep(5)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <span>Continuar a Recetas Médicas</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Nuevo Tratamiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Registrar Procedimiento o Terapéutica</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTratamiento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tratamiento / Procedimiento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tratamiento}
                  onChange={(e) => setTratamiento(e.target.value)}
                  placeholder="Ej: Curación de herida, Sondaje uretral, Fluidoterapia IV..."
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Duración (Días)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={duracionDias}
                    onChange={(e) => setDuracionDias(e.target.value)}
                    placeholder="Ej: 5"
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Estado del Tratamiento
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">ACTIVO (En curso)</option>
                    <option value="COMPLETADO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">COMPLETADO</option>
                    <option value="SUSPENDIDO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">SUSPENDIDO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Indicaciones & Cuidados Especiales
                </label>
                <textarea
                  rows={3}
                  value={indicaciones}
                  onChange={(e) => setIndicaciones(e.target.value)}
                  placeholder="Pautas de aplicación, frecuencia de curaciones, restricción de alimentos o paseos..."
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
                  {isSaving ? 'Guardando...' : 'Agregar Tratamiento'}
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
        title="Eliminar Tratamiento"
        description="¿Confirmas la eliminación de este tratamiento del expediente clínico?"
        confirmText="Eliminar"
        cancelText="Conservar"
        isLoading={isSaving}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </>
  )
}
