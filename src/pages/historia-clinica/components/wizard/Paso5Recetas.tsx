import { useState } from 'react'
import {
  Pill,
  Plus,
  Trash2,
  Sparkles,
  Calculator,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Clock,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import type { HistoriaRecetas } from '@/types/medical-record.types'

const FREQUENT_MEDS = [
  'Amoxicilina',
  'Metronidazol',
  'Enrofloxacina',
  'Meloxicam',
  'Prednisona',
  'Omeprazol',
  'Loperamida',
  'Vitamina B12',
]

const FREQUENCIES = [
  'Cada 12 horas',
  'Cada 8 horas',
  'Cada 6 horas',
  'Una vez al día',
  'Según necesidad',
  'Tres veces a la semana',
]

const ROUTES = [
  'Oral',
  'Subcutáneo',
  'Intramuscular',
  'Intravenoso',
  'Tópico',
  'Ocular',
  'Ótico',
]

export function Paso5Recetas() {
  const { recetas, signosVitales, addReceta, deleteReceta, setStep, isSaving, error } =
    useConsultationWizardStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [medicamento, setMedicamento] = useState('')
  const [dosis, setDosis] = useState('')
  const [frecuencia, setFrecuencia] = useState('Cada 12 horas')
  const [viaAdministracion, setViaAdministracion] = useState('Oral')
  const [duracion, setDuracion] = useState('')
  const [instrucciones, setInstrucciones] = useState('')

  // Estado para la calculadora de dosis
  const [dosePerKg, setDosePerKg] = useState<string>('')
  const patientWeight = signosVitales?.peso ? Number(signosVitales.peso) : null

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleOpenWithMed = (medName?: string) => {
    setMedicamento(medName || '')
    setDosis('')
    setFrecuencia('Cada 12 horas')
    setViaAdministracion('Oral')
    setDuracion('7 días')
    setInstrucciones('')
    setDosePerKg('')
    setIsModalOpen(true)
  }

  // Calculadora de dosis automática
  const handleCalculateDose = () => {
    if (!patientWeight || !dosePerKg) return
    const mgKg = parseFloat(dosePerKg.replace(',', '.'))
    if (isNaN(mgKg) || mgKg <= 0) return

    const totalMg = (mgKg * patientWeight).toFixed(1)
    const resultString = `${mgKg} mg/kg = ${totalMg} mg`
    setDosis(resultString)
  }

  const handleSaveReceta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medicamento.trim()) return

    const success = await addReceta({
      medicamento: medicamento.trim(),
      dosis: dosis.trim() || null,
      frecuencia,
      via_administracion: viaAdministracion,
      duracion: duracion.trim() || null,
      instrucciones: instrucciones.trim() || null,
    })

    if (success) {
      setIsModalOpen(false)
      setMedicamento('')
      setDosis('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    await deleteReceta(deletingId)
    setDeletingId(null)
  }

  return (
    <>
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Paso 5: Recetas Farmacológicas (P - Plan Domiciliario)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Prescripción de medicamentos con calculadora posológica inteligente por peso
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleOpenWithMed()}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Medicamento</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Chips de Medicamentos Frecuentes */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Medicamentos Frecuentes:</span>
              </div>
              {patientWeight && (
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Peso paciente: {patientWeight} kg
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENT_MEDS.map((med) => (
                <button
                  key={med}
                  type="button"
                  onClick={() => handleOpenWithMed(med)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-750 transition-colors shadow-2xs font-medium"
                >
                  + {med}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Recetas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Prescripciones Médicas ({recetas.length})
            </h4>

            {recetas.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No se han prescrito recetas farmacológicas en esta consulta.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Usa los chips rápidos o haz clic en "Agregar Medicamento".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {recetas.map((r: HistoriaRecetas) => (
                  <div
                    key={r.id_receta}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs flex items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{r.medicamento}</span>
                        {r.dosis && (
                          <Badge variant="outline" className="text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                            {r.dosis}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium">
                          <Compass className="w-3 h-3 text-slate-400" />
                          {r.via_administracion || 'Oral'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {r.frecuencia}
                        </span>
                        {r.duracion && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            × {r.duracion}
                          </span>
                        )}
                      </div>

                      {r.instrucciones && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed">
                          <strong className="text-slate-700 dark:text-slate-200">Instrucciones para el tutor:</strong>{' '}
                          {r.instrucciones}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingId(r.id_receta)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar receta"
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
              onClick={() => setStep(4)}
              className="gap-2 text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Tratamientos</span>
            </Button>

            <Button
              type="button"
              onClick={() => setStep(6)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <span>Continuar a Exámenes (Laboratorio)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Crear Receta con Calculadora Dinámica */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Prescribir Medicamento</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReceta} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Fármaco <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={medicamento}
                  onChange={(e) => setMedicamento(e.target.value)}
                  placeholder="Ej: Amoxicilina + Ác. Clavulánico 250mg"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Calculadora por peso */}
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Calculadora Posológica por Peso
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    Peso: {patientWeight ? `${patientWeight} kg` : 'Sin peso en Paso 2'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={dosePerKg}
                      onChange={(e) => setDosePerKg(e.target.value)}
                      placeholder="Dosis por kg (ej: 10 mg/kg)"
                      className="w-full text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!patientWeight || !dosePerKg}
                    onClick={handleCalculateDose}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                  >
                    Calcular Dosis
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Dosis Calculada / Cantidad
                  </label>
                  <input
                    type="text"
                    value={dosis}
                    onChange={(e) => setDosis(e.target.value)}
                    placeholder="Ej: 150 mg ó 1 tableta"
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Frecuencia
                  </label>
                  <select
                    value={frecuencia}
                    onChange={(e) => setFrecuencia(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Vía de Administración
                  </label>
                  <select
                    value={viaAdministracion}
                    onChange={(e) => setViaAdministracion(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ROUTES.map((r) => (
                      <option key={r} value={r} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Duración del Tratamiento
                  </label>
                  <input
                    type="text"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    placeholder="Ej: 7 días, 14 días"
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Instrucciones para el Tutor
                </label>
                <textarea
                  rows={2}
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  placeholder="Ej: Administrar con las comidas para evitar malestar gástrico. No suspender antes de tiempo."
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
                  {isSaving ? 'Guardando...' : 'Prescribir Medicamento'}
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
        title="Eliminar Receta"
        description="¿Confirmas la eliminación de esta prescripción de la consulta?"
        confirmText="Eliminar"
        cancelText="Conservar"
        isLoading={isSaving}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </>
  )
}
