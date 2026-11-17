import React, { useState } from 'react'
import {
  X,
  Scissors,
  Calendar,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Printer,
  MessageCircle,
  FileText,
  Play,
  Check,
  Ban,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/stores/useToastStore'
import { cirugiasService } from '@/services/cirugias.service'
import { formatDateTime } from '@/lib/utils'
import type { Cirugia, EstadoCirugia } from '@/types/cirugia.types'

interface SurgeryDetailModalProps {
  isOpen: boolean
  surgery: Cirugia | null
  onClose: () => void
  onFinalizeClick: (surgery: Cirugia) => void
  onSurgeryUpdated: () => void
}

export const SurgeryDetailModal: React.FC<SurgeryDetailModalProps> = ({
  isOpen,
  surgery,
  onClose,
  onFinalizeClick,
  onSurgeryUpdated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !surgery) return null

  const pet = surgery.mascota
  const client = pet?.cliente

  // WhatsApp dinámico según estado
  const handleWhatsApp = () => {
    if (!client?.telefono) {
      toast.warning('El tutor no tiene registrado un número telefónico')
      return
    }
    const cleanPhone = client.telefono.replace(/\D/g, '')
    const targetPhone = cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`

    let messageText = ''
    if (surgery.estado === 'PROGRAMADA') {
      messageText = `Hola ${client.nombres || ''}, le escribimos de la veterinaria para recordarle que la cirugía de ${surgery.procedimiento} para ${pet?.nombre || 'su mascota'} está programada para el ${formatDateTime(surgery.fecha_cirugia)}.`
    } else if (surgery.estado === 'EN_PROCESO') {
      messageText = `Hola ${client.nombres || ''}, le informamos que ${pet?.nombre || 'su mascota'} se encuentra actualmente en procedimiento en quirófano (${surgery.procedimiento}). Le notificaremos en cuanto concluya la intervención.`
    } else if (surgery.estado === 'FINALIZADA') {
      messageText = `Estimado(a) ${client.nombres || ''}, le comunicamos que ${pet?.nombre || 'su mascota'} ha finalizado su cirugía de ${surgery.procedimiento} exitosamente y se encuentra en recuperación.`
    } else {
      messageText = `Hola ${client.nombres || ''}, le escribimos de la veterinaria respecto a la cirugía de ${surgery.procedimiento} para ${pet?.nombre || 'su mascota'}.`
    }

    const message = encodeURIComponent(messageText)
    window.open(`https://wa.me/${targetPhone}?text=${message}`, '_blank')
  }

  // Iniciar Cirugía
  const handleStartSurgery = async () => {
    try {
      setIsProcessing(true)
      await cirugiasService.iniciarCirugia(surgery.id_cirugia)
      toast.success(`Cirugía de ${surgery.procedimiento} iniciada en quirófano`)
      onSurgeryUpdated()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Error al iniciar la cirugía')
    } finally {
      setIsProcessing(false)
    }
  }

  // Cancelar Cirugía
  const handleCancelSurgery = async () => {
    const reason = prompt('Ingrese el motivo de cancelación de la cirugía:')
    if (reason === null) return

    try {
      setIsProcessing(true)
      await cirugiasService.cancelarCirugia(surgery.id_cirugia, reason)
      toast.success('Intervención quirúrgica cancelada')
      onSurgeryUpdated()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Error al cancelar la cirugía')
    } finally {
      setIsProcessing(false)
    }
  }

  // Impresión de Protocolo Quirúrgico
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte Quirúrgico - ${surgery.procedimiento} - ${pet?.nombre || 'Paciente'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
            h1 { font-size: 20px; margin-bottom: 4px; color: #1e293b; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
            .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 16px; font-size: 13px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; background: #e0e7ff; color: #3730a3; }
            .section-title { font-size: 14px; font-weight: bold; margin-top: 18px; margin-bottom: 6px; color: #0f172a; }
            .protocol-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>PROTOCOLO Y REPORTE OPERATORIO QUIRÚRGICO</h1>
          <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Fecha emisión: ${new Date().toLocaleString('es-BO')}</p>
          
          <div class="box">
            <b>Procedimiento:</b> ${surgery.procedimiento}<br/>
            <b>Cirujano Responsable:</b> ${surgery.cirujano}<br/>
            <b>Fecha y Hora de Intervención:</b> ${new Date(surgery.fecha_cirugia).toLocaleString('es-BO')}<br/>
            <b>Estado Quirúrgico:</b> <span class="badge">${surgery.estado}</span><br/>
            <b>Paciente:</b> ${pet?.nombre || ''} (${pet?.especie || ''} ${pet?.raza ? `- ${pet.raza}` : ''})<br/>
            <b>Tutor:</b> ${client?.nombres || ''} ${client?.apellidos || ''} ${client?.telefono ? ` • Tel: ${client.telefono}` : ''}<br/>
            ${surgery.anestesia ? `<b>Protocolo Anestésico:</b> ${surgery.anestesia}<br/>` : ''}
          </div>

          <div class="section-title">REPORTE Y HALLAZGOS QUIRÚRGICOS</div>
          <div class="protocol-box">
            ${surgery.observaciones || 'Sin observaciones registradas.'}
          </div>

          <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; color: #475569;">
            <div style="border-top: 1px solid #94a3b8; width: 220px; text-align: center; padding-top: 6px;">
              Firma Cirujano: ${surgery.cirujano}
            </div>
            <div style="border-top: 1px solid #94a3b8; width: 220px; text-align: center; padding-top: 6px;">
              Firma y Aceptación Tutor
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const getStatusBadge = (estado: EstadoCirugia) => {
    switch (estado) {
      case 'PROGRAMADA':
        return (
          <Badge className="bg-[#3F51B5] hover:bg-[#3949AB] text-white">
            Programada
          </Badge>
        )
      case 'EN_PROCESO':
        return (
          <Badge className="bg-[#FF9800] hover:bg-[#F57C00] text-white animate-pulse">
            En Quirófano
          </Badge>
        )
      case 'FINALIZADA':
        return (
          <Badge className="bg-[#4CAF50] hover:bg-[#43A047] text-white">
            Finalizada
          </Badge>
        )
      case 'CANCELADA':
        return (
          <Badge className="bg-[#F44336] hover:bg-[#E53935] text-white">
            Cancelada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {surgery.procedimiento}
                </h3>
                {getStatusBadge(surgery.estado)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cirujano: {surgery.cirujano} • {formatDateTime(surgery.fecha_cirugia)}
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

        {/* Action Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              className="text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Tutor
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Reporte Quirúrgico
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {surgery.estado === 'PROGRAMADA' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCancelSurgery}
                  disabled={isProcessing}
                  className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200"
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartSurgery}
                  disabled={isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-xs"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  Iniciar Quirófano
                </Button>
              </>
            )}

            {surgery.estado === 'EN_PROCESO' && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClose()
                  onFinalizeClick(surgery)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs animate-pulse"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Finalizar Cirugía
              </Button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Ficha Mascota y Tutor */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={pet?.foto_url}
                fallback={pet?.nombre || 'VET'}
                className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {pet?.nombre}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {pet?.especie} {pet?.raza ? `• ${pet.raza}` : ''}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tutor: {client?.nombres || 'Sin tutor'} {client?.apellidos || ''}
                  {client?.telefono && ` • Tel: ${client.telefono}`}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles del Procedimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-xs">
              <span className="text-slate-400 block font-medium">Cirujano Responsable:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {surgery.cirujano}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-xs">
              <span className="text-slate-400 block font-medium">Fecha y Hora Programada:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {formatDateTime(surgery.fecha_cirugia)}
              </span>
            </div>
          </div>

          {/* Protocolo Anestésico */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-xs">
            <span className="text-slate-400 block font-medium">Protocolo Anestésico:</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {surgery.anestesia || 'No especificado previamente'}
            </p>
          </div>

          {/* Sección Reporte Quirúrgico / Protocolo */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Reporte Quirúrgico y Protocolo Operatorio
            </h4>

            {surgery.estado === 'PROGRAMADA' ? (
              <div className="p-4 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-300">
                <p className="font-semibold">La cirugía aún no ha comenzado.</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  {surgery.observaciones ? (
                    <>
                      <strong>Indicaciones pre-quirúrgicas:</strong> {surgery.observaciones}
                    </>
                  ) : (
                    'Al ingresar el paciente a sala de operaciones, active el botón "Iniciar Quirófano".'
                  )}
                </p>
              </div>
            ) : surgery.estado === 'EN_PROCESO' ? (
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 animate-pulse">
                <p className="font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  Cirugía en curso en quirófano
                </p>
                <p className="mt-1 text-amber-800 dark:text-amber-300">
                  El procedimiento está activo. Registre la técnica, hemostasia, suturas y complicaciones al finalizar la intervención.
                </p>
              </div>
            ) : surgery.estado === 'FINALIZADA' ? (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Protocolo Quirúrgico Concluido
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 font-mono text-[11px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {surgery.observaciones || 'Sin reporte detallado registrado.'}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 text-xs text-rose-800 dark:text-rose-300">
                <p className="font-semibold">Cirugía Cancelada</p>
                <p className="mt-0.5">{surgery.observaciones || 'Sin motivo especificado'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
