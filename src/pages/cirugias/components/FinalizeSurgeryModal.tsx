import React, { useState } from 'react'
import { X, CheckCircle2, AlertCircle, Loader2, FileText, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/stores/useToastStore'
import { cirugiasService } from '@/services/cirugias.service'
import { finalizarCirugiaSchema } from '@/types/cirugia.types'
import type { Cirugia } from '@/types/cirugia.types'

interface FinalizeSurgeryModalProps {
  isOpen: boolean
  surgery: Cirugia | null
  onClose: () => void
  onSuccess: () => void
}

export const FinalizeSurgeryModal: React.FC<FinalizeSurgeryModalProps> = ({
  isOpen,
  surgery,
  onClose,
  onSuccess,
}) => {
  const [hallazgos, setHallazgos] = useState('')
  const [complicaciones, setComplicaciones] = useState('Ninguna')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !surgery) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = finalizarCirugiaSchema.safeParse({
      hallazgos: hallazgos.trim(),
      complicaciones: complicaciones.trim() || 'Ninguna',
    })

    if (!validation.success) {
      setError(validation.error.issues[0].message)
      return
    }

    try {
      setIsSubmitting(true)
      await cirugiasService.finalizarCirugia(
        surgery.id_cirugia,
        hallazgos.trim(),
        complicaciones.trim() || 'Ninguna'
      )
      toast.success(`Cirugía de ${surgery.procedimiento} concluida y registrada exitosamente`)
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Error al finalizar el protocolo quirúrgico')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Protocolo Operatorio y Cierre Quirúrgico
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {surgery.procedimiento} • Paciente: {surgery.mascota?.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Finalización de Acto Quirúrgico
            </p>
            <p>
              El estado pasará a <strong>FINALIZADA</strong> y quedará registrado el reporte formal con técnica aplicada y complicaciones intraoperatorias.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hallazgos Intraoperatorios y Técnica Quirúrgica *
            </label>
            <textarea
              rows={4}
              placeholder="Describa la incisión, abordaje, hemostasia, suturas empleadas, material de osteosíntesis o condiciones anatómicas encontradas..."
              value={hallazgos}
              onChange={(e) => {
                setHallazgos(e.target.value)
                setError(null)
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Complicaciones Intraoperatorias
            </label>
            <input
              type="text"
              placeholder="Ej: Ninguna, hemorragia leve controlada por electrocauterio..."
              value={complicaciones}
              onChange={(e) => setComplicaciones(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Completar Protocolo
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
