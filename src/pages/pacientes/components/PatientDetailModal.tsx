import { useState } from 'react'
import { X, Phone, Mail, Calendar, Weight, Heart, PawPrint, MessageCircle, FileText, UserCheck, AlertCircle, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/lib/utils'
import { BOLIVIAN_DEPARTMENTS } from '@/constants/petCatalogs'
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal'
import type { MascotaConCliente } from '@/types/patient.types'

interface PatientDetailModalProps {
  isOpen: boolean
  patient: MascotaConCliente | null
  onClose: () => void
  onEdit?: (patient: MascotaConCliente) => void
  zIndexClassName?: string
}

export function PatientDetailModal({
  isOpen,
  patient,
  onClose,
  onEdit,
  zIndexClassName = 'z-50',
}: PatientDetailModalProps) {
  const navigate = useNavigate()

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)

  if (!isOpen || !patient) return null

  const client = patient.cliente
  const ownerFullName = client ? `${client.nombres || ''} ${client.apellidos || ''}`.trim() : 'Sin tutor asignado'
  const departmentName = BOLIVIAN_DEPARTMENTS.find((d) => d.id === client?.depto)?.nombre || 'No especificado'

  // Formato de edad amigable
  const formatAge = () => {
    const years = patient.edad
    const months = patient.edad_meses
    const parts = []
    if (years !== null && years !== undefined && years > 0) {
      parts.push(`${years} ${years === 1 ? 'año' : 'años'}`)
    }
    if (months !== null && months !== undefined && months > 0) {
      parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`)
    }
    return parts.length > 0 ? parts.join(', ') : 'No registrada'
  }

  // Enlace limpio a WhatsApp boliviano
  const cleanPhone = client?.telefono ? client.telefono.replace(/\D/g, '') : ''
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`}`
    : null

  return (
    <>
      <div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200`}>
        <div
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                <PawPrint className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Ficha Clínica del Paciente</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Expediente general y datos de contacto de su tutor</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Header de Paciente con Foto */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-slate-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 border border-emerald-100/60 dark:border-emerald-900/40">
              <div
                className={`relative group ${patient.foto_url ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (patient.foto_url) {
                    setIsImagePreviewOpen(true)
                  }
                }}
                title={patient.foto_url ? 'Clic para ver imagen ampliada' : undefined}
              >
                <Avatar
                  src={patient.foto_url || undefined}
                  fallback={patient.nombre}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md object-cover transition-transform group-hover:scale-[1.03]"
                />
                {patient.foto_url && (
                  <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-6 h-6 drop-shadow-sm" />
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                    patient.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  title={`Estado: ${patient.estado}`}
                />
              </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{patient.nombre}</h3>
                <Badge
                  variant={patient.estado === 'ACTIVO' ? 'default' : 'secondary'}
                  className="text-[11px] font-semibold uppercase"
                >
                  {patient.estado || 'ACTIVO'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-transparent dark:border-emerald-800/40">
                  {patient.especie}
                </span>
                <span>•</span>
                <span>{patient.raza || 'Mestizo / Sin raza definida'}</span>
                <span>•</span>
                <span className="capitalize">{patient.sexo ? patient.sexo.toLowerCase() : 'Sexo no especificado'}</span>
              </div>

              {patient.fecha_crea && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Registrado en sistema el {formatDate(patient.fecha_crea)}
                </p>
              )}
            </div>

            {onEdit && (
              <div className="sm:self-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onEdit(patient)
                  }}
                  className="text-xs h-8"
                >
                  Editar Datos
                </Button>
              </div>
            )}
          </div>

          {/* Grid de Métricas Clínicas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Weight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Peso Actual</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {patient.peso ? `${patient.peso} kg` : 'Sin registro'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Edad</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatAge()}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Sexo</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
                {patient.sexo || 'No definido'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>F. Nacimiento</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {patient.fecha_nac ? formatDate(patient.fecha_nac) : 'No indicada'}
              </p>
            </div>
          </div>

          {/* Alertas Médicas si existen */}
          {patient.alertas && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">Alertas Clínicas Especiales:</span>
                <span className="text-amber-800 dark:text-amber-300">{patient.alertas}</span>
              </div>
            </div>
          )}

          {/* Tarjeta del Tutor / Propietario */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Datos del Propietario / Tutor
                </h4>
              </div>
              {client?.numero_ci && (
                <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  CI: {client.numero_ci}
                </span>
              )}
            </div>

            {client ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-400 block">Nombre Completo</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                    {ownerFullName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    Depto: {departmentName}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-slate-400 dark:text-slate-400 block">Contacto Directo</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {client.telefono ? (
                      <>
                        <a
                          href={`tel:${client.telefono}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{client.telefono}</span>
                        </a>

                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors border border-emerald-200 dark:border-emerald-800/50"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-400 italic">Sin teléfono</span>
                    )}
                  </div>

                  {client.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${client.email}`} className="hover:underline truncate">
                        {client.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-400 italic py-2">
                No hay información de tutor vinculada a este registro.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer con accesos rápidos */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                navigate('/historia-clinica')
              }}
              className="text-xs gap-1.5 h-9"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Historia Clínica
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                navigate('/citas')
              }}
              className="text-xs gap-1.5 h-9"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Cita
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                navigate('/hospitalizaciones')
              }}
              className="text-xs gap-1.5 h-9 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50"
            >
              Hospitalizar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                navigate('/cirugias')
              }}
              className="text-xs gap-1.5 h-9 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50"
            >
              Cirugía
            </Button>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 px-5 w-full sm:w-auto"
          >
            Cerrar Ficha
          </Button>
        </div>
      </div>
    </div>

    {/* Modal de Imagen Flotante Ampliada */}
    <ImagePreviewModal
      isOpen={isImagePreviewOpen}
      imageUrl={patient.foto_url}
      title={patient.nombre}
      subtitle={`${patient.especie} • ${patient.raza || 'Mestizo'}`}
      onClose={() => setIsImagePreviewOpen(false)}
    />
  </>
  )
}
