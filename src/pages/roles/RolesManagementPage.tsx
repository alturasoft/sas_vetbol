import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Shield,
  ShieldPlus,
  Search,
  RefreshCw,
  KeyRound,
  Crown,
  Users,
  Trash2,
  SlidersHorizontal,
  Lock,
  Loader2,
  Eye,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { RolesService } from '@/services/roles.service'
import { toast } from '@/stores/useToastStore'
import { CreateRoleModal } from './components/CreateRoleModal'
import type { RolRBAC } from '@/types/staff.types'

export function RolesManagementPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [rolesList, setRolesList] = useState<RolRBAC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'TODOS' | 'SISTEMA' | 'PERSONALIZADOS'>('TODOS')

  // Modales y acciones
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingRole, setDeletingRole] = useState<RolRBAC | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const clinicId = Number(
    currentTenant?.id_veterinaria ||
      user?.id_veterinaria ||
      (currentTenant?.id && !isNaN(Number(currentTenant.id)) ? Number(currentTenant.id) : 0) ||
      1
  )

  useEffect(() => {
    if (clinicId > 0) {
      loadRoles()
    }
  }, [clinicId])

  const loadRoles = async () => {
    if (!clinicId || clinicId <= 0) return
    setIsLoading(true)
    try {
      const data = await RolesService.getRolesByClinic(clinicId, false)
      setRolesList(data)
    } catch (err: any) {
      console.error('Error al cargar roles de la clínica:', err)
      toast.error('Error de Conexión', err?.message || 'No se pudieron cargar los roles de la clínica.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrado en memoria
  const filteredRoles = useMemo(() => {
    return rolesList.filter((rol) => {
      if (typeFilter === 'SISTEMA' && !rol.es_sistema) return false
      if (typeFilter === 'PERSONALIZADOS' && rol.es_sistema) return false

      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase().trim()
      return (
        rol.nombre.toLowerCase().includes(term) ||
        (rol.descripcion && rol.descripcion.toLowerCase().includes(term))
      )
    })
  }, [rolesList, typeFilter, searchTerm])

  // Estadísticas
  const stats = useMemo(() => {
    const total = rolesList.length
    const system = rolesList.filter((r) => r.es_sistema).length
    const custom = rolesList.filter((r) => !r.es_sistema).length
    const totalAssignedUsers = rolesList.reduce((acc, r) => acc + (r.cantUsuarios || 0), 0)
    return { total, system, custom, totalAssignedUsers }
  }, [rolesList])

  // Activar / Desactivar rol personalizado (conservando sus permisos)
  const handleToggleActivo = async (rol: RolRBAC) => {
    if (rol.es_sistema) {
      toast.warning(
        'Rol de Sistema Protegido',
        `El rol "${rol.nombre}" es parte del núcleo del sistema y no puede desactivarse.`
      )
      return
    }

    setTogglingId(rol.id_rol)
    try {
      const updated = await RolesService.toggleRolActivo(rol, !rol.activo)
      setRolesList((prev) =>
        prev.map((item) => (item.id_rol === rol.id_rol ? updated : item))
      )
      toast.success(
        updated.activo ? 'Rol Activado' : 'Rol Desactivado',
        `El rol "${rol.nombre}" ahora se encuentra ${updated.activo ? 'activo' : 'inactivo'}.`
      )
    } catch (err: any) {
      console.error('Error al cambiar estado del rol:', err)
      toast.error('Operación Fallida', err?.message || 'No se pudo cambiar el estado del rol.')
    } finally {
      setTogglingId(null)
    }
  }

  // Eliminar rol personalizado con confirmación destructiva
  const handleConfirmDelete = async () => {
    if (!deletingRole) return
    if (deletingRole.es_sistema) {
      setDeletingRole(null)
      return
    }

    setIsDeleting(true)
    try {
      await RolesService.deleteRol(deletingRole)
      toast.success(
        'Rol Eliminado',
        `El rol personalizado "${deletingRole.nombre}" fue eliminado de la clínica.`
      )
      setDeletingRole(null)
      loadRoles()
    } catch (err: any) {
      console.error('Error al eliminar rol:', err)
      toast.error('Error al Eliminar', err?.message || 'No se pudo eliminar el rol seleccionado.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Roles y Control de Accesos (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra los roles del sistema y crea perfiles personalizados de permisos para los miembros de tu clínica.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRoles}
            disabled={isLoading}
            className="gap-2 text-xs cursor-pointer dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
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

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer shadow-xs"
          >
            <ShieldPlus className="w-4 h-4" />
            Nuevo Rol Personalizado
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas de Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Roles
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {stats.total}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Roles de Sistema
              </span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {stats.system}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                Roles Personalizados
              </span>
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                {stats.custom}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Personal con Rol
              </span>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                {stats.totalAssignedUsers}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
              <Users className="w-5 h-5" />
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
            placeholder="Buscar rol por nombre o descripción..."
            className="pl-9 text-xs dark:bg-slate-950/50 dark:border-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setTypeFilter('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'TODOS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('SISTEMA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'SISTEMA'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Sistema ({stats.system})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('PERSONALIZADOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'PERSONALIZADOS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Personalizados ({stats.custom})
          </button>
        </div>
      </div>

      {/* 4. Tabla de Roles de la Clínica */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Cargando roles de la clínica...</span>
          </div>
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            icon={Shield}
            title={searchTerm ? 'Sin coincidencias' : 'No se encontraron roles'}
            description={
              searchTerm
                ? 'Ningún rol coincide con tu búsqueda.'
                : 'Puedes crear un rol personalizado para definir permisos a medida en tu clínica.'
            }
            actionLabel="Crear Rol Personalizado"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300 py-3.5">
                    Rol y Descripción
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Origen
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Permisos Concedidos
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Usuarios Asignados
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Estado Activo
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 dark:text-slate-300 text-right pr-6">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((rol) => {
                  const isSystem = rol.es_sistema
                  const isSystemAdmin = rol.nombre.trim().toUpperCase() === 'ADMINISTRADOR'
                  const isToggling = togglingId === rol.id_rol

                  return (
                    <TableRow
                      key={rol.id_rol}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/80"
                    >
                      {/* Rol y Descripción */}
                      <TableCell className="py-3.5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              isSystemAdmin
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : isSystem
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                            }`}
                          >
                            {isSystemAdmin ? (
                              <Crown className="w-5 h-5" />
                            ) : isSystem ? (
                              <ShieldCheck className="w-5 h-5" />
                            ) : (
                              <Shield className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wide">
                                {rol.nombre}
                              </span>
                              {isSystemAdmin && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                  Superusuario Total
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                              {rol.descripcion ||
                                (isSystemAdmin
                                  ? 'Acceso total e incondicional a todos los módulos de la clínica'
                                  : isSystem
                                  ? 'Rol estándar preconfigurado del sistema'
                                  : 'Rol personalizado creado por la clínica')}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Origen */}
                      <TableCell>
                        {isSystem ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3 h-3 text-slate-400" />
                            Sistema
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            Personalizado
                          </span>
                        )}
                      </TableCell>

                      {/* Permisos Concedidos */}
                      <TableCell>
                        {isSystemAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Todos (Acceso Total)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                            {rol.cantPermisos} {rol.cantPermisos === 1 ? 'permiso' : 'permisos'}
                          </span>
                        )}
                      </TableCell>

                      {/* Usuarios Asignados */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {rol.cantUsuarios} {rol.cantUsuarios === 1 ? 'miembro' : 'miembros'}
                        </span>
                      </TableCell>

                      {/* Switch de Estado Activo (Inmutable si es_sistema === true) */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isSystem ? true : rol.activo}
                            disabled={isSystem || isToggling}
                            onClick={() => handleToggleActivo(rol)}
                            title={
                              isSystem
                                ? 'Los roles de sistema están protegidos y no pueden desactivarse'
                                : rol.activo
                                ? 'Desactivar rol personalizado'
                                : 'Activar rol personalizado'
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                              isSystem || rol.activo
                                ? 'bg-emerald-600'
                                : 'bg-slate-300 dark:bg-slate-700'
                            } ${
                              isSystem || isToggling
                                ? 'opacity-60 cursor-not-allowed'
                                : 'cursor-pointer'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                isSystem || rol.activo ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          <span
                            className={`text-xs font-semibold ${
                              isSystem || rol.activo
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {isToggling
                              ? 'Actualizando...'
                              : isSystem
                              ? 'Siempre Activo'
                              : rol.activo
                              ? 'Activo'
                              : 'Inactivo'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={isSystemAdmin ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => navigate(`/roles/permisos/${rol.id_rol}`)}
                            className={
                              isSystemAdmin
                                ? 'gap-1.5 text-xs cursor-pointer dark:border-slate-700 dark:text-slate-200'
                                : 'gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                            }
                          >
                            {isSystemAdmin ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                Ver Permisos
                              </>
                            ) : (
                              <>
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Configurar Permisos
                              </>
                            )}
                          </Button>

                          {/* Regla 2: El botón de eliminar se oculta si es_sistema === true */}
                          {!isSystem && (
                            <button
                              type="button"
                              onClick={() => setDeletingRole(rol)}
                              title="Eliminar Rol Personalizado"
                              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 5. Modal de Creación de Rol Personalizado */}
      <CreateRoleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        clinicId={clinicId}
        onCreated={(newRol, configureNow) => {
          loadRoles()
          if (configureNow && newRol.id_rol) {
            navigate(`/roles/permisos/${newRol.id_rol}`)
          }
        }}
      />

      {/* 6. Confirmación Destructiva de Eliminación de Rol */}
      <ConfirmDialog
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Rol Personalizado"
        description={`¿Estás seguro de que deseas eliminar el rol "${deletingRole?.nombre}"? ${
          deletingRole?.cantUsuarios
            ? `Actualmente tiene ${deletingRole.cantUsuarios} miembro(s) asignado(s), quienes quedarán desvinculados de este rol.`
            : 'Esta acción eliminará su configuración de permisos de forma permanente.'
        }`}
        confirmText="Eliminar Rol"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

