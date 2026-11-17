import { useState, useEffect } from 'react'
import {
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Calendar,
  PawPrint,
  Weight,
  MessageCircle,
  Dog,
  ZoomIn,
  Edit2,
  AlertCircle,
  ChevronRight,
  Megaphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { formatDate } from '@/lib/utils'
import { BOLIVIAN_DEPARTMENTS } from '@/constants/petCatalogs'
import { patientsService } from '@/services/patients.service'
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal'
import { PatientDetailModal } from '@/pages/pacientes/components/PatientDetailModal'
import { usePermissions } from '@/hooks/usePermissions'
import type { Clientes } from '@/types/database.types'
import type { MascotaConCliente } from '@/types/patient.types'

interface ClientDetailModalProps {
  isOpen: boolean
  client: Clientes | null
  tenantId: number
  onClose: () => void
  onEdit?: (client: Clientes) => void
  onSendNotice?: (client: Clientes) => void
  onSelectPet?: (pet: MascotaConCliente) => void
}

export function ClientDetailModal({
  isOpen,
  client,
  tenantId,
  onClose,
  onEdit,
  onSendNotice,
  onSelectPet,
}: ClientDetailModalProps) {
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission('EDITAR_CLIENTES')
  const canSendNotice = hasPermission('ADMINISTRAR_PUBLICACIONES') || hasPermission('EDITAR_CLIENTES')

  const [pets, setPets] = useState<MascotaConCliente[]>([])
  const [isLoadingPets, setIsLoadingPets] = useState<boolean>(true)
  const [selectedPet, setSelectedPet] = useState<MascotaConCliente | null>(null)

  // Imagen flotante ampliada
  const [previewImage, setPreviewImage] = useState<{
    url: string | null
    title?: string
    subtitle?: string
  } | null>(null)

  const handleSelectPet = (pet: MascotaConCliente) => {
    // Asegurar que la mascota tenga el objeto cliente completo asociado
    const petWithClient: MascotaConCliente = {
      ...pet,
      cliente: pet.cliente || client || undefined,
    }
    setSelectedPet(petWithClient)
    onSelectPet?.(petWithClient)
  }

  useEffect(() => {
    if (!isOpen || !client) return

    const loadClientPets = async () => {
      try {
        setIsLoadingPets(true)
        const data = await patientsService.getPatients(tenantId, {
          idCliente: client.id_cliente,
        })
        setPets(data)
      } catch (err) {
        console.error('Error al cargar mascotas del cliente:', err)
      } finally {
        setIsLoadingPets(false)
      }
    }

    loadClientPets()
  }, [isOpen, client, tenantId])

  if (!isOpen || !client) return null

  const fullName = `${client.nombres} ${client.apellidos}`.trim()
  const departmentName =
    BOLIVIAN_DEPARTMENTS.find((d) => d.id === client.depto)?.nombre || 'No especificado'

  const cleanPhone = client.telefono ? client.telefono.replace(/\D/g, '') : ''
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`}`
    : null

  // Formatear edad de mascota
  const formatPetAge = (pet: MascotaConCliente) => {
    const y = pet.edad
    const m = pet.edad_meses
    if (y && m) return `${y}a ${m}m`
    if (y) return `${y} ${y === 1 ? 'año' : 'años'}`
    if (m) return `${m} ${m === 1 ? 'mes' : 'meses'}`
    return null
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Ficha del Propietario</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Expediente de tutor y lista de mascotas registradas
                </p>
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
            {/* Header del Tutor con Foto y Contacto */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-slate-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-950 border border-emerald-100/70 dark:border-slate-800 shadow-xs">
              <div
                className={`relative group shrink-0 ${client.foto_url ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (client.foto_url) {
                    setPreviewImage({
                      url: client.foto_url,
                      title: fullName,
                      subtitle: `CI: ${client.numero_ci || 'Sin CI'} • Tel: ${client.telefono || 'Sin teléfono'}`,
                    })
                  }
                }}
                title={client.foto_url ? 'Clic para ver fotografía ampliada' : undefined}
              >
                {client.foto_url ? (
                  <OptimizedImage
                    src={client.foto_url}
                    alt={fullName}
                    containerClassName="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md transition-transform group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-2xl border-2 border-white dark:border-slate-800 shadow-md">
                    {client.nombres?.[0] || 'C'}
                  </div>
                )}
                {client.foto_url && (
                  <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-6 h-6 drop-shadow-sm" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{fullName}</h3>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    ID #{client.id_cliente}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>CI: <strong className="text-slate-900 dark:text-slate-100">{client.numero_ci || 'Sin CI registrado'}</strong></span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>Depto: <strong className="text-slate-900 dark:text-slate-100">{departmentName}</strong></span>
                  </div>

                  {client.fecha_crea && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:col-span-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span className="text-slate-500 dark:text-slate-400">
                        Registrado el {formatDate(client.fecha_crea)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Vías de contacto */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  {client.telefono ? (
                    <>
                      <a
                        href={`tel:${client.telefono}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{client.telefono}</span>
                      </a>

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 shadow-2xs transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sin teléfono registrado</span>
                  )}

                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{client.email}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:self-start">
                {canSendNotice && onSendNotice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendNotice(client)}
                    className="text-xs h-8 gap-1.5 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    title="Enviar aviso o notificación push al cliente"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Enviar Aviso</span>
                  </Button>
                )}

                {canEdit && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose()
                      onEdit(client)
                    }}
                    className="text-xs h-8 gap-1.5 border-slate-200 dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar Tutor</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Sección de Mascotas Registradas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Mascotas Registradas ({pets.length})
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                  Toca una mascota para abrir su ficha clínica
                </span>
              </div>

              {isLoadingPets ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={`pet-skel-${i}`}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 animate-pulse flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="w-24 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="w-32 h-2.5 bg-slate-100 dark:bg-slate-900 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pets.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
                  <Dog className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No tiene mascotas registradas a su nombre
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Las mascotas añadidas aparecerán en este listado con su ficha clínica.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pets.map((pet) => {
                    const ageText = formatPetAge(pet)
                    return (
                      <div
                        key={pet.id_mascota}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectPet(pet)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleSelectPet(pet)
                          }
                        }}
                        title="Haz clic para abrir la ficha de la mascota"
                        className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all cursor-pointer flex items-start gap-3 select-none"
                      >
                        {/* Foto de la Mascota */}
                        <div
                          className={`relative group/photo shrink-0 ${
                            pet.foto_url ? 'cursor-zoom-in' : ''
                          }`}
                          onClick={(e) => {
                            if (pet.foto_url) {
                              e.stopPropagation()
                              setPreviewImage({
                                url: pet.foto_url,
                                title: pet.nombre,
                                subtitle: `${pet.especie}${pet.raza ? ` • ${pet.raza}` : ''}`,
                              })
                            }
                          }}
                          title={pet.foto_url ? 'Clic para ver foto ampliada' : undefined}
                        >
                          <Avatar
                            src={pet.foto_url || undefined}
                            fallback={pet.nombre}
                            className="w-14 h-14 rounded-xl border border-emerald-100 dark:border-emerald-900 object-cover shrink-0 transition-transform group-hover/photo:scale-105"
                          />
                          {pet.foto_url && (
                            <div className="absolute inset-0 rounded-xl bg-black/30 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-4 h-4 drop-shadow-sm" />
                            </div>
                          )}
                        </div>

                        {/* Datos de la Mascota */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {pet.nombre}
                            </h5>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge
                                variant={
                                  pet.especie.toLowerCase().includes('perro')
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-[9px] px-1.5 py-0 uppercase"
                              >
                                {pet.especie}
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>

                          <span className="text-xs text-slate-600 dark:text-slate-400 block truncate">
                            {pet.raza || 'Mestizo / Criollo'}
                          </span>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                            <span>
                              {pet.sexo
                                ? pet.sexo.toUpperCase() === 'MACHO'
                                  ? 'Macho'
                                  : 'Hembra'
                                : 'Sexo n/a'}
                            </span>
                            {ageText && (
                              <>
                                <span>•</span>
                                <span>{ageText}</span>
                              </>
                            )}
                            {pet.peso && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-0.5 font-medium text-slate-700 dark:text-slate-300">
                                  <Weight className="w-3 h-3 text-slate-400" />
                                  {pet.peso} kg
                                </span>
                              </>
                            )}
                          </div>

                          {pet.alertas && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 rounded px-1.5 py-0.5 mt-1 border border-amber-200/60 dark:border-amber-900/60">
                              <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                              <span className="truncate">{pet.alertas}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-semibold"
            >
              Cerrar Ficha
            </Button>
          </div>
        </div>
      </div>

      {/* Visor de Imagen Flotante Ampliada */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        zIndexClassName="z-[70]"
        onClose={() => setPreviewImage(null)}
      />

      {/* Ficha Clínica de la Mascota */}
      <PatientDetailModal
        isOpen={!!selectedPet}
        patient={selectedPet}
        zIndexClassName="z-[60]"
        onClose={() => setSelectedPet(null)}
      />
    </>
  )
}
