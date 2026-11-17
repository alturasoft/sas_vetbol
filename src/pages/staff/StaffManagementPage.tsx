import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  RefreshCw,
  CalendarClock,
  Eye,
  Stethoscope,
  Briefcase,
  Crown,
  Shield,
  ShieldCheck,
  KeyRound,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
  ZoomIn,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { ActionGuard } from '@/components/auth/ActionGuard'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { toast } from '@/stores/useToastStore'
import { StaffService } from '@/services/staff.service'
import { StaffRegistrationModal } from './components/StaffRegistrationModal'
import { StaffEditModal } from './components/StaffEditModal'
import { StaffDetailModal } from './components/StaffDetailModal'
import { DoctorScheduleModal } from './components/DoctorScheduleModal'
import type { PersonaStaff, RolBase } from '@/types/staff.types'

export function StaffManagementPage() {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [staffList, setStaffList] = useState<PersonaStaff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'TODOS' | RolBase>('TODOS')

  // Modales
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<PersonaStaff | null>(null)
  const [detailStaff, setDetailStaff] = useState<PersonaStaff | null>(null)
  const [schedulingDoctor, setSchedulingDoctor] = useState<PersonaStaff | null>(null)

  // Baja de personal y ConfirmDialog
  const [deletingStaff, setDeletingStaff] = useState<PersonaStaff | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Zoom de fotografía
  const [previewImage, setPreviewImage] = useState<{
    url: string | null
    title?: string
    subtitle?: string
  } | null>(null)

  const clinicId = Number(
    currentTenant?.id_veterinaria ||
    user?.id_veterinaria ||
    (currentTenant?.id && !isNaN(Number(currentTenant.id)) ? Number(currentTenant.id) : 0) ||
    1
  )

  useEffect(() => {
    if (clinicId > 0) {
      loadStaff()
    }
  }, [clinicId])

  const loadStaff = async () => {
    if (!clinicId || clinicId <= 0) return
    setIsLoading(true)
    try {
      const data = await StaffService.getStaffByClinic(clinicId)
      setStaffList(data)
    } catch (err: any) {
      console.error('Error al cargar staff:', err)
      toast.error('Error de Conexión', err?.message || 'No se pudo cargar el listado del personal.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrado de staff en memoria
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      // Filtro de rol
      if (roleFilter !== 'TODOS' && item.rol !== roleFilter) {
        return false
      }

      // Filtro de búsqueda
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase().trim()
      const fullName = `${item.nombres} ${item.apellidos}`.toLowerCase()
      const email = item.email?.toLowerCase() || ''
      const phone = item.telefono?.toLowerCase() || ''

      return fullName.includes(term) || email.includes(term) || phone.includes(term)
    })
  }, [staffList, roleFilter, searchTerm])

  // Métricas
  const stats = useMemo(() => {
    const total = staffList.length
    const doctors = staffList.filter((s) => s.rol === 'MED').length
    const admins = staffList.filter((s) => s.rol === 'ADM').length
    const owners = staffList.filter((s) => s.rol === 'PRO').length
    return { total, doctors, admins, owners }
  }, [staffList])

  // Confirmar baja de personal
  const handleConfirmBaja = async () => {
    if (!deletingStaff) return

    // Prevención de auto-baja en el frontend
    if (user && user.id_persona && user.id_persona === deletingStaff.id_persona) {
      toast.warning('Operación Denegada', 'No puedes dar de baja a tu propia cuenta activa.')
      setDeletingStaff(null)
      return
    }

    setIsDeleting(true)
    try {
      await StaffService.darDeBajaStaff(deletingStaff.id_persona)
      toast.success(
        'Baja Procesada',
        `Se dio de baja a ${deletingStaff.nombres} ${deletingStaff.apellidos} y su acceso fue revocado.`
      )
      setDeletingStaff(null)
      loadStaff()
    } catch (err: any) {
      console.error('Error al dar de baja:', err)
      toast.error('Error en Operación', err.message || 'No se pudo completar la baja del colaborador.')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderRoleBadge = (rol: string) => {
    switch (rol) {
      case 'PRO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Propietario
          </span>
        )
      case 'MED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Médico Veterinario
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Administrativo
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Staff Médico y Personal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra los integrantes de tu clínica, roles de acceso, turnos de atención y credenciales.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStaff}
            disabled={isLoading}
            className="gap-2 text-xs dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <Link to="/visor-permisos">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs cursor-pointer dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Mis Accesos
            </Button>
          </Link>

          <ActionGuard permission="ADMINISTRAR_ROLES">
            <Link to="/roles">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs cursor-pointer border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Roles y Permisos
              </Button>
            </Link>
          </ActionGuard>

          <ActionGuard permission="ADMINISTRAR_USUARIOS">
            <Button
              size="sm"
              onClick={() => setIsRegisterOpen(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Nuevo Miembro
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* 2. Tarjetas de Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Personal
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{stats.total}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Médicos Veterinarios
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{stats.doctors}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
              <Stethoscope className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                Administrativos
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{stats.admins}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
              <Briefcase className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Propietarios / Directores
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{stats.owners}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
              <Crown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Barra de Búsqueda y Pestañas de Filtro */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="pl-9 text-xs dark:bg-slate-950/50 dark:border-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setRoleFilter('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === 'TODOS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('MED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === 'MED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Médicos ({stats.doctors})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('ADM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === 'ADM'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Administrativos ({stats.admins})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('PRO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === 'PRO'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Propietarios ({stats.owners})
          </button>
        </div>
      </div>

      {/* 4. Tabla de Personal */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Cargando personal de la clínica...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchTerm ? 'Sin coincidencias' : 'No hay colaboradores registrados'}
            description={
              searchTerm
                ? 'No encontramos ningún miembro que coincida con tus criterios de búsqueda.'
                : 'Comienza agregando al primer médico o administrativo de tu equipo de trabajo.'
            }
            actionLabel={searchTerm ? undefined : 'Registrar Personal'}
            onAction={searchTerm ? undefined : () => setIsRegisterOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300 py-3.5">Colaborador</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300">Función & Rol</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300">Contacto</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300">Estado</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300 text-right pr-6">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow
                    key={staff.id_persona}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/80"
                  >
                    {/* Colaborador */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative group cursor-pointer shrink-0"
                          onClick={() => {
                            if (staff.foto_url) {
                              setPreviewImage({
                                url: staff.foto_url,
                                title: `${staff.nombres} ${staff.apellidos}`,
                                subtitle: staff.rol === 'MED' ? 'Médico Veterinario' : 'Personal',
                              })
                            }
                          }}
                        >
                          {staff.foto_url ? (
                            <OptimizedImage
                              src={staff.foto_url}
                              alt={staff.nombres}
                              containerClassName="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 group-hover:ring-2 group-hover:ring-emerald-500 transition-all"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                              {(staff.nombres[0] || 'V') + (staff.apellidos[0] || 'T')}
                            </div>
                          )}
                          {staff.foto_url && (
                            <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <ZoomIn className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {staff.nombres} {staff.apellidos}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            ID: #{staff.id_persona}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Función & Rol */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div>{renderRoleBadge(staff.rol)}</div>
                        {staff.rol_info && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Shield className="w-3 h-3 text-slate-400" />
                            {staff.rol_info.nombre}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Contacto */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={staff.email}>
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{staff.email}</span>
                        </div>
                        {staff.telefono && (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{staff.telefono}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Activo
                      </span>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ficha Detalle */}
                        <button
                          type="button"
                          onClick={() => setDetailStaff(staff)}
                          title="Ver Ficha Detallada"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Configurar Horarios (Solo Médicos) */}
                        <ActionGuard permission="ADMINISTRAR_USUARIOS">
                          {staff.rol === 'MED' ? (
                            <button
                              type="button"
                              onClick={() => setSchedulingDoctor(staff)}
                              title="Turnos Semanales y Disponibilidad"
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                            >
                              <CalendarClock className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="w-7 h-7 inline-block" />
                          )}

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => setEditingStaff(staff)}
                            title="Editar Datos"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Dar de Baja (con confirmación modal) */}
                          <button
                            type="button"
                            onClick={() => setDeletingStaff(staff)}
                            title="Dar de Baja"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </ActionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 5. Modales Operativos */}
      <StaffRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={loadStaff}
        clinicId={clinicId}
      />

      <StaffEditModal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        onSuccess={loadStaff}
        staff={editingStaff}
        clinicId={clinicId}
      />

      <StaffDetailModal
        isOpen={!!detailStaff}
        onClose={() => setDetailStaff(null)}
        staff={detailStaff}
        onEditClick={() => {
          setEditingStaff(detailStaff)
        }}
        onScheduleClick={() => {
          setSchedulingDoctor(detailStaff)
        }}
      />

      <DoctorScheduleModal
        isOpen={!!schedulingDoctor}
        onClose={() => setSchedulingDoctor(null)}
        doctor={schedulingDoctor}
        clinicId={clinicId}
      />

      {/* Modal de Zoom de Imagen */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || null}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
      />

      {/* Confirmación Destructiva para Baja de Personal */}
      <ConfirmDialog
        isOpen={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleConfirmBaja}
        title="Dar de Baja al Colaborador"
        description={`¿Estás seguro de que deseas dar de baja a ${deletingStaff?.nombres} ${deletingStaff?.apellidos}? Se revocarán sus credenciales de acceso a la plataforma y se cancelarán sus turnos de atención. Su historial clínico, recetas y consultas previas quedarán protegidas e intactas.`}
        confirmText="Confirmar Baja"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
