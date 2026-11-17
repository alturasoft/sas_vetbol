import React, { useState } from 'react'
import {
  X,
  Clock,
  User,
  Dog,
  Phone,
  Mail,
  Stethoscope,
  FileText,
  Play,
  CheckCircle2,
  XCircle,
  Calendar,
  Bell,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { RealAppointmentItem } from '@/types/appointment.types'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { usePermissions } from '@/hooks/usePermissions'

interface AppointmentDetailModalProps {
  appointment: RealAppointmentItem | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (idCita: number, newStatus: string) => Promise<void>
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { hasPermission } = usePermissions()
  const canCancel = hasPermission('CANCELAR_CITAS')
  const canEdit = hasPermission('EDITAR_CITAS')

  const [isUpdating, setIsUpdating] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (!isOpen || !appointment) return null

  const handleUpdate = async (status: string) => {
    try {
      setIsUpdating(true)
      await onStatusChange(appointment.id, status)
      onClose()
    } catch (err) {
      console.error('Error al actualizar estado:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const startDate = new Date(appointment.start_time)
  const endDate = new Date(appointment.end_time)

  const dateFormatted = format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  const startTime = format(startDate, 'HH:mm')
  const endTime = format(endDate, 'HH:mm')

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Cabecera del modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Detalle de la Cita #{appointment.id}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{dateFormatted}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo con datos */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Status and Time card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Horario Programado
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {startTime} - {endTime}
                  </span>
                </div>
              </div>

              <div>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
            </div>

            {/* Banner informativo de notificación Push si la cita está pendiente */}
            {appointment.status === 'PENDIENTE' && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/50 text-sky-900 dark:text-sky-300 text-xs shadow-xs">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sky-950 dark:text-sky-100">Notificación Push Automática</p>
                  <p className="text-sky-700 dark:text-sky-300 text-[11px] leading-snug">
                    Al confirmar el turno, el sistema enviará automáticamente una notificación push al celular del cliente ({appointment.owner_name}).
                  </p>
                </div>
              </div>
            )}

            {/* Motivo de consulta */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Motivo del Turno
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                {appointment.title || appointment.reason || 'Consulta General'}
              </p>
            </div>

            {/* Datos del Paciente y Propietario en 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paciente */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Dog className="w-4 h-4" />
                  <span>Paciente</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{appointment.patient_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {appointment.patient_species || 'Mascota'}{' '}
                    {appointment.patient_breed ? `• ${appointment.patient_breed}` : ''}
                  </p>
                </div>
              </div>

              {/* Dueño */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>Propietario</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{appointment.owner_name}</p>
                  {appointment.owner_phone && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{appointment.owner_phone}</span>
                    </p>
                  )}
                  {appointment.owner_email && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{appointment.owner_email}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Veterinario asignado */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Médico Veterinario Responsable</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{appointment.veterinarian_name}</span>
              </div>
            </div>

            {/* Observaciones */}
            {appointment.notes && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Observaciones
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Acciones del pie */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
            {/* Destructive action */}
            {canCancel && appointment.status !== 'CANCELADA' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isUpdating}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 gap-1.5 h-9 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancelar Cita</span>
              </Button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isUpdating}
                className="text-xs h-9 px-3 cursor-pointer"
              >
                Cerrar
              </Button>

              {canEdit && appointment.status === 'PENDIENTE' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdate('CONFIRMADA')}
                  disabled={isUpdating}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white gap-1.5 h-9 px-3.5 cursor-pointer shadow-xs transition-colors"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirmando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar y Notificar</span>
                    </>
                  )}
                </Button>
              )}

              {canEdit && appointment.status !== 'EN_PROCESO' && appointment.status !== 'COMPLETADA' && appointment.status !== 'CANCELADA' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdate('EN_PROCESO')}
                  disabled={isUpdating}
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 h-9 px-3 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar Consulta</span>
                </Button>
              )}

              {canEdit && appointment.status === 'EN_PROCESO' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdate('COMPLETADA')}
                  disabled={isUpdating}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 px-3 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Marcar Completada</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para acción destructiva */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="¿Cancelar esta cita médica?"
        description={`Se cancelará la cita programada para ${appointment.patient_name} a las ${startTime}. Esta acción cambiará el estado de la cita a cancelada.`}
        confirmText="Sí, cancelar cita"
        cancelText="No, mantener"
        variant="danger"
        isLoading={isUpdating}
        onConfirm={async () => {
          await handleUpdate('CANCELADA')
          setShowCancelConfirm(false)
        }}
        onClose={() => setShowCancelConfirm(false)}
      />
    </>
  )
}
