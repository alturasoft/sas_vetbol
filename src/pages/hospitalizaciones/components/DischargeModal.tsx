import React, { useState } from 'react'
import { X, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/stores/useToastStore'
import { hospitalizacionesService } from '@/services/hospitalizaciones.service'
import { darAltaSchema } from '@/types/hospitalizacion.types'
import type { Hospitalizacion } from '@/types/hospitalizacion.types'

interface DischargeModalProps {
  isOpen: boolean
  admission: Hospitalizacion | null
  onClose: () => void
  onSuccess: () => void
}

export const DischargeModal: React.FC<DischargeModalProps> = ({
  isOpen,
  admission,
  onClose,
  onSuccess,
}) => {
  const [observacionesAlta, setObservacionesAlta] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !admission) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = darAltaSchema.safeParse({ observaciones_alta: observacionesAlta.trim() })
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      return
    }

    try {
      setIsSubmitting(true)
      await hospitalizacionesService.darAlta(
        admission.id_hospitalizacion,
        observacionesAlta.trim()
      )
      toast.success(`Paciente ${admission.mascota?.nombre} dado de alta satisfactoriamente`)
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar el alta médica')
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
                Alta Médica de Hospitalización
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paciente: {admission.mascota?.nombre} ({admission.mascota?.especie})
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
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Confirmación de Cierre de Estadía</p>
            <p className="mt-0.5">
              Al confirmar el alta, la jaula/canil quedará liberada para nuevos ingresos y se registrará la fecha y hora de salida.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Indicaciones de Egreso y Tratamiento Ambulatorio *
            </label>
            <textarea
              rows={4}
              placeholder="Describa el estado de salud al egreso, receta domiciliaria, cuidados especiales, dieta o fecha de control..."
              value={observacionesAlta}
              onChange={(e) => {
                setObservacionesAlta(e.target.value)
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
                  Registrando Alta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Alta Médica
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
