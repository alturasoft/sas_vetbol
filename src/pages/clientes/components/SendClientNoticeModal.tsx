import { useState, useEffect } from 'react'
import {
  Megaphone,
  Send,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/stores/useToastStore'
import { clientsService } from '@/services/clients.service'
import type { Clientes } from '@/types/database.types'

interface SendClientNoticeModalProps {
  isOpen: boolean
  onClose: () => void
  client: Clientes | null
  tenantId: number
  onSuccess?: () => void
}

interface QuickTemplate {
  label: string
  titulo: string
  cuerpo: string
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    label: 'Vacuna Pendiente',
    titulo: 'Recordatorio de Vacunación 💉🐾',
    cuerpo: 'Estimado propietario, le recordamos que su mascota tiene una vacuna programada próximamente. Por favor agende su cita o visítenos en la clínica.',
  },
  {
    label: 'Control Médico',
    titulo: 'Control Veterinario Preventivo 🏥🩺',
    cuerpo: 'Hola, es momento de realizar el control veterinario periódico para mantener la salud y bienestar de su mascota al día.',
  },
  {
    label: 'Resultados Listos',
    titulo: 'Resultados de Laboratorio Disponibles 📋🔬',
    cuerpo: 'Le informamos que los resultados de los estudios o análisis clínicos solicitados ya están disponibles en su historial.',
  },
  {
    label: 'Desparasitación',
    titulo: 'Aviso de Desparasitación 💊',
    cuerpo: 'Recordatorio para la próxima dosis de desparasitación interna/externa de su mascota. ¡La prevención es salud!',
  },
]

export function SendClientNoticeModal({
  isOpen,
  onClose,
  client,
  tenantId,
  onSuccess,
}: SendClientNoticeModalProps) {
  const [titulo, setTitulo] = useState<string>('')
  const [cuerpo, setCuerpo] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTitulo('')
      setCuerpo('')
      setErrorMessage(null)
    }
  }, [isOpen, client])

  if (!isOpen || !client) return null

  const fullName = `${client.nombres} ${client.apellidos}`.trim()
  const hasFcmToken = Boolean(client.fcm_token && client.fcm_token.trim().length > 0)

  const handleApplyTemplate = (template: QuickTemplate) => {
    setTitulo(template.titulo)
    setCuerpo(template.cuerpo)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanTitulo = titulo.trim()
    if (!cleanTitulo) {
      setErrorMessage('El título del aviso es obligatorio.')
      return
    }

    if (cleanTitulo.length > 200) {
      setErrorMessage('El título no puede exceder los 200 caracteres.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      await clientsService.sendClientNotice({
        id_veterinaria: tenantId,
        id_cliente: client.id_cliente,
        titulo: cleanTitulo,
        cuerpo: cuerpo.trim() || null,
      })

      toast.success(
        `Aviso enviado con éxito a ${fullName}.`,
        hasFcmToken
          ? 'Notificación Push despachada al dispositivo móvil'
          : 'Aviso registrado en el buzón del cliente'
      )

      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('Error al enviar aviso al cliente:', err)
      const detail = err.message || 'No se pudo registrar el aviso en la base de datos.'
      setErrorMessage(detail)
      toast.error(detail, 'Error al Enviar Aviso')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-notice-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="send-notice-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight"
              >
                Enviar Aviso al Cliente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Notificación push y mensaje para la app móvil
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Ficha rápida del destinatario */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {client.foto_url ? (
                <img
                  src={client.foto_url}
                  alt={fullName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200 dark:border-amber-900">
                  {client.nombres?.[0] || 'C'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {fullName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {client.telefono ? `Tel: ${client.telefono}` : `CI: ${client.numero_ci || 'Sin CI'}`}
                </p>
              </div>
            </div>

            {/* Estado FCM */}
            <div className="shrink-0 text-right">
              {hasFcmToken ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Smartphone className="w-3 h-3" />
                  App activa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                  <Smartphone className="w-3 h-3 text-slate-400" />
                  Buzón app
                </span>
              )}
            </div>
          </div>

          {/* Plantillas Rápidas */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Plantillas rápidas sugeridas:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950/50 dark:hover:text-amber-200 border border-slate-200/70 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campo Título */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="aviso-titulo"
                className="text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Título del Aviso <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono ${
                  titulo.length > 190
                    ? 'text-rose-500 font-bold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {titulo.length}/200
              </span>
            </div>
            <Input
              id="aviso-titulo"
              type="text"
              required
              maxLength={200}
              placeholder="Ej: Recordatorio de vacuna pendiente"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              disabled={isSubmitting}
              className="text-xs h-9 focus-visible:ring-amber-500"
            />
          </div>

          {/* Campo Cuerpo / Mensaje */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="aviso-cuerpo"
                className="text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Mensaje o Detalle <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <span
                className={`text-[10px] font-mono ${
                  cuerpo.length > 950
                    ? 'text-rose-500 font-bold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {cuerpo.length}/1000
              </span>
            </div>
            <textarea
              id="aviso-cuerpo"
              rows={4}
              maxLength={1000}
              placeholder="Escribe aquí las indicaciones médicas, fecha recomendada de visita o mensaje personalizado..."
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none transition-colors"
            />
          </div>

          {/* Banner de Información Operativa */}
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="text-[11px] leading-relaxed">
              El aviso se guardará en el historial de la base de datos y activará automáticamente el webhook hacia la Edge Function de Firebase Cloud Messaging (FCM v1).
            </div>
          </div>

          {/* Mensaje de Error si ocurre */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Acciones del Modal */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9 cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !titulo.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 gap-2 shadow-xs cursor-pointer focus:ring-2 focus:ring-amber-500"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando aviso...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Aviso</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
