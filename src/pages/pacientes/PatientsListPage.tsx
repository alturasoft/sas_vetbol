import { useState, useEffect, useMemo } from 'react'
import {
  Dog,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  RefreshCw,
  PawPrint,
  Weight,
  MessageCircle,
  Activity,
  Heart,
  ZoomIn,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from '@/stores/useToastStore'
import { patientsService } from '@/services/patients.service'
import { PET_SPECIES } from '@/constants/petCatalogs'
import { PatientDetailModal } from './components/PatientDetailModal'
import { PatientFormModal } from './components/PatientFormModal'
import type { MascotaConCliente } from '@/types/patient.types'

export function PatientsListPage() {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const { hasPermission } = usePermissions()

  const tenantId = currentTenant?.id_veterinaria || user?.id_veterinaria || 14

  // Datos reales
  const [patients, setPatients] = useState<MascotaConCliente[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Filtros reactivos
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedSpecies, setSelectedSpecies] = useState<string>('ALL')
  const [selectedEstado, setSelectedEstado] = useState<string>('ALL')

  // Modales
  const [detailPatient, setDetailPatient] = useState<MascotaConCliente | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  const [formPatient, setFormPatient] = useState<MascotaConCliente | null>(null)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)

  const [deletingPatient, setDeletingPatient] = useState<MascotaConCliente | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  // Vista previa de imagen flotante ampliada
  const [previewImage, setPreviewImage] = useState<{
    url: string
    title?: string
    subtitle?: string
  } | null>(null)

  // Cargar pacientes de la base de datos Supabase
  const loadPatients = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      const data = await patientsService.getPatients(tenantId)
      setPatients(data)
    } catch (err: any) {
      console.error('Error al cargar pacientes:', err)
      toast.error(
        'No se pudo recuperar la lista de pacientes de la base de datos.',
        'Error de Conexión'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [tenantId])

  // Filtrado reactivo en memoria sobre campos clínicos y de tutor
  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return patients.filter((p) => {
      // Filtro de especie
      const matchesSpecies =
        selectedSpecies === 'ALL' ||
        p.especie.toLowerCase() === selectedSpecies.toLowerCase()

      // Filtro de estado
      const matchesEstado =
        selectedEstado === 'ALL' ||
        (p.estado || 'ACTIVO').toUpperCase() === selectedEstado.toUpperCase()

      if (!matchesSpecies || !matchesEstado) return false

      if (!term) return true

      // Búsqueda en nombre de mascota, raza, especie
      const petNameMatch = (p.nombre || '').toLowerCase().includes(term)
      const breedMatch = (p.raza || '').toLowerCase().includes(term)
      const speciesMatch = (p.especie || '').toLowerCase().includes(term)

      // Búsqueda en tutor / cliente
      const client = p.cliente
      const ownerFirstMatch = (client?.nombres || '').toLowerCase().includes(term)
      const ownerLastMatch = (client?.apellidos || '').toLowerCase().includes(term)
      const ownerPhoneMatch = (client?.telefono || '').includes(term)
      const ownerCiMatch = (client?.numero_ci || '').toLowerCase().includes(term)

      return (
        petNameMatch ||
        breedMatch ||
        speciesMatch ||
        ownerFirstMatch ||
        ownerLastMatch ||
        ownerPhoneMatch ||
        ownerCiMatch
      )
    })
  }, [patients, searchTerm, selectedSpecies, selectedEstado])

  // Métricas rápidas
  const metrics = useMemo(() => {
    const total = patients.length
    const canines = patients.filter((p) =>
      p.especie.toLowerCase().includes('perro') || p.especie.toLowerCase().includes('canin')
    ).length
    const felines = patients.filter((p) =>
      p.especie.toLowerCase().includes('gato') || p.especie.toLowerCase().includes('felin')
    ).length
    const others = total - canines - felines

    return { total, canines, felines, others }
  }, [patients])

  // Eliminación destructiva con confirmación
  const handleDeleteConfirm = async () => {
    if (!deletingPatient) return
    if (!hasPermission('ELIMINAR_MASCOTAS')) {
      toast.error('No tienes permisos para eliminar pacientes.')
      return
    }

    try {
      setIsDeleting(true)
      await patientsService.deletePatient(deletingPatient.id_mascota)
      toast.success(
        `El paciente ${deletingPatient.nombre} fue eliminado correctamente del sistema.`,
        'Paciente Eliminado'
      )
      setDeletingPatient(null)
      loadPatients()
    } catch (err: any) {
      console.error('Error al eliminar paciente:', err)
      toast.error(
        err.message || 'No se pudo eliminar el registro del paciente.',
        'Error de Eliminación'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Formato amigable de edad
  const formatPetAge = (p: MascotaConCliente) => {
    const y = p.edad
    const m = p.edad_meses
    if (y && m) return `${y}a ${m}m`
    if (y) return `${y} ${y === 1 ? 'año' : 'años'}`
    if (m) return `${m} ${m === 1 ? 'mes' : 'meses'}`
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Dog className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Pacientes y Mascotas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro clínico oficial de pacientes y datos de contacto de sus propietarios
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPatients(true)}
            disabled={isLoading || isRefreshing}
            className="h-10 text-xs gap-1.5 border-slate-200 dark:border-slate-800"
            title="Recargar datos desde la base de datos"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 ${
                isRefreshing ? 'animate-spin text-emerald-600' : ''
              }`}
            />
            <span className="hidden sm:inline">Refrescar</span>
          </Button>

          {hasPermission('CREAR_MASCOTAS') && (
            <Button
              onClick={() => {
                setFormPatient(null)
                setIsFormOpen(true)
              }}
              className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar Mascota
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards / Resumen Métrico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/40 flex items-center justify-center shrink-0">
            <PawPrint className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block">Total Pacientes</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{metrics.total}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-transparent dark:border-blue-800/40 flex items-center justify-center shrink-0">
            <Dog className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block">Caninos (Perros)</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{metrics.canines}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-transparent dark:border-amber-800/40 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block">Felinos (Gatos)</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{metrics.felines}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-transparent dark:border-purple-800/40 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block">Otras Especies</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{metrics.others}</span>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          {/* Input de búsqueda */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por paciente, raza, tutor, teléfono o CI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filtro por especie */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="h-10 text-xs px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
            >
              <option value="ALL">Todas las especies</option>
              {PET_SPECIES.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="h-10 text-xs px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-900/80">
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Paciente</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Especie / Raza</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Propietario / Tutor</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Contacto</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Biometría</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell>
                    <div className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-3.5 bg-slate-200 rounded" />
                        <div className="w-16 h-2.5 bg-slate-100 rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 animate-pulse">
                      <div className="w-14 h-4 bg-slate-200 rounded" />
                      <div className="w-20 h-3 bg-slate-100 rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 animate-pulse">
                      <div className="w-28 h-3.5 bg-slate-200 rounded" />
                      <div className="w-16 h-2.5 bg-slate-100 rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="w-14 h-4 bg-slate-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="w-16 h-7 bg-slate-200 rounded ml-auto animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <EmptyState
                    icon={Dog}
                    title={
                      searchTerm || selectedSpecies !== 'ALL' || selectedEstado !== 'ALL'
                        ? 'No se encontraron pacientes coincidentes'
                        : 'No hay pacientes registrados'
                    }
                    description={
                      searchTerm || selectedSpecies !== 'ALL' || selectedEstado !== 'ALL'
                        ? 'Intenta ajustar los filtros de búsqueda o restablecer la especie seleccionada.'
                        : 'Comienza registrando la primera mascota de tu veterinaria con sus datos clínicos y tutor.'
                    }
                    actionLabel={
                      searchTerm || selectedSpecies !== 'ALL' || selectedEstado !== 'ALL'
                        ? 'Limpiar Filtros'
                        : 'Registrar Mascota'
                    }
                    onAction={
                      searchTerm || selectedSpecies !== 'ALL' || selectedEstado !== 'ALL'
                        ? () => {
                            setSearchTerm('')
                            setSelectedSpecies('ALL')
                            setSelectedEstado('ALL')
                          }
                        : () => {
                            setFormPatient(null)
                            setIsFormOpen(true)
                          }
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => {
                const owner = patient.cliente
                const ownerName = owner
                  ? `${owner.nombres || ''} ${owner.apellidos || ''}`.trim()
                  : 'Sin tutor asignado'
                const cleanPhone = owner?.telefono ? owner.telefono.replace(/\D/g, '') : ''
                const waUrl = cleanPhone
                  ? `https://wa.me/${cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`}`
                  : null
                const petAgeText = formatPetAge(patient)

                return (
                  <TableRow
                    key={patient.id_mascota}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Paciente Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative group shrink-0 ${
                            patient.foto_url ? 'cursor-pointer' : ''
                          }`}
                          onClick={(e) => {
                            if (patient.foto_url) {
                              e.stopPropagation()
                              setPreviewImage({
                                url: patient.foto_url,
                                title: patient.nombre,
                                subtitle: `${patient.especie}${patient.raza ? ` • ${patient.raza}` : ''}`,
                              })
                            }
                          }}
                          title={patient.foto_url ? 'Clic para ver imagen ampliada' : undefined}
                        >
                          <Avatar
                            src={patient.foto_url || undefined}
                            fallback={patient.nombre}
                            className={`w-11 h-11 rounded-xl border border-emerald-100 object-cover shrink-0 transition-all ${
                              patient.foto_url
                                ? 'group-hover:scale-105 group-hover:border-emerald-400 group-hover:shadow-md'
                                : ''
                            }`}
                          />
                          {patient.foto_url && (
                            <div className="absolute inset-0 rounded-xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-4 h-4 drop-shadow-sm" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                              {patient.nombre}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                patient.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              title={`Estado: ${patient.estado}`}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {patient.sexo ? (patient.sexo.toUpperCase() === 'MACHO' ? 'Macho' : 'Hembra') : 'Sexo n/a'}
                            {petAgeText ? ` • ${petAgeText}` : ''}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Especie / Raza */}
                    <TableCell>
                      <Badge
                        variant={
                          patient.especie.toLowerCase().includes('perro')
                            ? 'default'
                            : 'secondary'
                        }
                        className="capitalize text-[10px] font-semibold"
                      >
                        {patient.especie}
                      </Badge>
                      <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5 truncate max-w-[150px]">
                        {patient.raza || 'Mestizo/Criollo'}
                      </span>
                    </TableCell>

                    {/* Propietario */}
                    <TableCell>
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
                        {ownerName}
                      </span>
                      {owner?.numero_ci && (
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400">
                          CI: {owner.numero_ci}
                        </span>
                      )}
                    </TableCell>

                    {/* Contacto */}
                    <TableCell>
                      {owner?.telefono ? (
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <a
                            href={`tel:${owner.telefono}`}
                            className="inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{owner.telefono}</span>
                          </a>

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                              title="Escribir por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 italic">Sin teléfono</span>
                      )}

                      {owner?.email && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block truncate max-w-[160px] mt-0.5">
                          {owner.email}
                        </span>
                      )}
                    </TableCell>

                    {/* Biometría */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <Weight className="w-3.5 h-3.5 text-slate-400" />
                        <span>{patient.peso ? `${patient.peso} kg` : '-'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5">
                        {patient.alertas ? 'Tiene alertas' : 'Sin alertas'}
                      </span>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Ficha Rápida */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDetailPatient(patient)
                            setIsDetailOpen(true)
                          }}
                          className="h-8 text-xs gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-800"
                          title="Ver Ficha Clínica"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ficha</span>
                        </Button>

                        {/* Botón Editar */}
                        {hasPermission('EDITAR_MASCOTAS') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormPatient(patient)
                              setIsFormOpen(true)
                            }}
                            className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Editar Paciente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Botón Eliminar */}
                        {hasPermission('ELIMINAR_MASCOTAS') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPatient(patient)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Eliminar Paciente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Ficha Clínica */}
      <PatientDetailModal
        isOpen={isDetailOpen}
        patient={detailPatient}
        onClose={() => {
          setIsDetailOpen(false)
          setDetailPatient(null)
        }}
        onEdit={
          hasPermission('EDITAR_MASCOTAS')
            ? (p) => {
                setFormPatient(p)
                setIsFormOpen(true)
              }
            : undefined
        }
      />

      {/* Modal Registro y Edición */}
      <PatientFormModal
        isOpen={isFormOpen}
        patient={formPatient}
        tenantId={tenantId}
        onClose={() => {
          setIsFormOpen(false)
          setFormPatient(null)
        }}
        onSuccess={() => {
          loadPatients()
        }}
      />

      {/* Modal de Confirmación de Eliminación Destructiva */}
      <ConfirmDialog
        isOpen={!!deletingPatient}
        title={`¿Dar de baja a ${deletingPatient?.nombre}?`}
        description={
          <span>
            Esta acción eliminará el registro clínico del paciente{' '}
            <strong>{deletingPatient?.nombre}</strong> y su fotografía asociada. Los
            historiales médicos previos conservarán la referencia histórica.
          </span>
        }
        confirmText="Eliminar Paciente"
        cancelText="Conservar Paciente"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingPatient(null)}
      />

      {/* Modal de Imagen Flotante Ampliada */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  )
}
