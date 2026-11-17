import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Shield,
  Lock,
  CheckCircle2,
  RefreshCw,
  Search,
  KeyRound,
  Crown,
  Users,
  Dog,
  Calendar,
  FileText,
  Syringe,
  Settings,
  BarChart3,
  Megaphone,
  UserCheck,
  Loader2,
  Sparkles,
  Building2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/EmptyState'
import { ActionGuard } from '@/components/auth/ActionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { useTenantStore } from '@/stores/useTenantStore'
import { RolesService } from '@/services/roles.service'
import { toast } from '@/stores/useToastStore'
import type { PermisoRBAC } from '@/types/staff.types'

export function getModuleIcon(modulo: string) {
  const norm = modulo.toLowerCase()
  if (norm.includes('cliente')) return Users
  if (norm.includes('mascota') || norm.includes('paciente')) return Dog
  if (norm.includes('cita') || norm.includes('agenda')) return Calendar
  if (norm.includes('historia') || norm.includes('clínica') || norm.includes('clinica')) return FileText
  if (norm.includes('vacuna') || norm.includes('receta')) return Syringe
  if (norm.includes('config')) return Settings
  if (norm.includes('reporte')) return BarChart3
  if (norm.includes('publicacion') || norm.includes('anuncio')) return Megaphone
  if (norm.includes('usuario') || norm.includes('personal')) return UserCheck
  if (norm.includes('rol')) return KeyRound
  return Shield
}

export function VisorPermisosPage() {
  const {
    user,
    rolNombre,
    hasPermission,
    refreshPermissions,
    isAdmin,
    isSuperAdmin,
  } = usePermissions()
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [allPermissions, setAllPermissions] = useState<PermisoRBAC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'CONCEDIDOS' | 'RESTRINGIDOS'>('TODOS')
  const [selectedModulo, setSelectedModulo] = useState<string>('TODOS')

  useEffect(() => {
    loadCatalog()
  }, [])

  const loadCatalog = async () => {
    setIsLoading(true)
    try {
      const catalog = await RolesService.getPermisos()
      setAllPermissions(catalog)
    } catch (err: any) {
      console.error('Error al cargar catálogo de permisos:', err)
      toast.error('Error de Carga', 'No se pudo obtener el catálogo de permisos del sistema.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncSession = async () => {
    setIsRefreshing(true)
    try {
      await refreshPermissions()
      const catalog = await RolesService.getPermisos()
      setAllPermissions(catalog)
      toast.success(
        'Permisos Sincronizados',
        `Se actualizó la matriz de accesos para tu rol activo (${rolNombre}).`
      )
    } catch (err: any) {
      toast.error('Error al Sincronizar', err?.message || 'No se pudieron refrescar los permisos.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Lista única de módulos ordenada
  const modulosList = useMemo(() => {
    const set = new Set<string>()
    allPermissions.forEach((p) => set.add(p.modulo))
    return Array.from(set)
  }, [allPermissions])

  // Estadísticas globales del usuario frente al catálogo maestro
  const stats = useMemo(() => {
    const total = allPermissions.length
    let granted = 0
    const grantedModules = new Set<string>()

    allPermissions.forEach((p) => {
      if (hasPermission(p.codigo)) {
        granted++
        grantedModules.add(p.modulo)
      }
    })

    const restricted = Math.max(0, total - granted)
    return {
      total,
      granted,
      restricted,
      enabledModules: grantedModules.size,
      totalModules: modulosList.length,
    }
  }, [allPermissions, hasPermission, modulosList.length])

  // Filtrado por término, estado (concedido/restringido) y módulo
  const groupedPermissions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    const filtered = allPermissions.filter((perm) => {
      const isGranted = hasPermission(perm.codigo)

      if (statusFilter === 'CONCEDIDOS' && !isGranted) return false
      if (statusFilter === 'RESTRINGIDOS' && isGranted) return false
      if (selectedModulo !== 'TODOS' && perm.modulo !== selectedModulo) return false

      if (!term) return true
      return (
        perm.nombre.toLowerCase().includes(term) ||
        perm.codigo.toLowerCase().includes(term) ||
        perm.modulo.toLowerCase().includes(term) ||
        (perm.descripcion && perm.descripcion.toLowerCase().includes(term))
      )
    })

    const map = new Map<string, PermisoRBAC[]>()
    filtered.forEach((perm) => {
      const group = map.get(perm.modulo) || []
      group.push(perm)
      map.set(perm.modulo, group)
    })

    return Array.from(map.entries())
  }, [allPermissions, hasPermission, searchTerm, statusFilter, selectedModulo])

  const clinicName = currentTenant?.name || user?.veterinaria_nombre || 'Clínica Activa'
  const isUnconditionalAdmin =
    rolNombre === 'ADMINISTRADOR' || isAdmin || isSuperAdmin

  return (
    <div className="space-y-6">
      {/* 1. Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <KeyRound className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Mis Accesos y Permisos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visor de diagnóstico RBAC con el detalle de los privilegios concedidos a tu cuenta en{' '}
            <strong className="text-slate-700 dark:text-slate-200">{clinicName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSession}
            disabled={isRefreshing || isLoading}
            className="gap-2 text-xs cursor-pointer dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sincronizar Permisos
          </Button>

          <ActionGuard permission="ADMINISTRAR_ROLES">
            <Link to="/roles">
              <Button
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                Gestionar Roles de Clínica
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      {/* 2. Banner de Identidad y Rol Activo */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            {isUnconditionalAdmin ? (
              <Crown className="w-6 h-6 text-amber-500" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Rol RBAC Asignado:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-2xs">
                <Shield className="w-3.5 h-3.5" />
                {rolNombre}
              </span>
              {isUnconditionalAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Superusuario Incondicional
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Usuario: <strong className="font-bold">{user?.nombre_completo || user?.full_name}</strong> ({user?.email})
            </p>
            {isUnconditionalAdmin && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Como {rolNombre}, tienes todos los permisos del catálogo habilitados automáticamente en el sistema.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Tenant Aislado: <strong className="text-slate-900 dark:text-slate-100">{clinicName}</strong>
          </span>
        </div>
      </div>

      {/* 3. Tarjetas de Resumen (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Catálogo
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
                Permisos Activos
              </span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {stats.granted}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Restringidos
              </span>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
                {stats.restricted}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                Módulos con Acceso
              </span>
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                {stats.enabledModules} / {stats.totalModules}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
              <KeyRound className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Barra de Búsqueda y Filtros */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por permiso, código (ej. VER_CITAS) o módulo..."
              className="pl-9 text-xs dark:bg-slate-950/50 dark:border-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'TODOS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CONCEDIDOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'CONCEDIDOS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Concedidos ({stats.granted})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('RESTRINGIDOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'RESTRINGIDOS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Restringidos ({stats.restricted})
            </button>
          </div>
        </div>

        {/* Píldoras de Módulos */}
        {modulosList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedModulo('TODOS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedModulo === 'TODOS'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Todos los módulos
            </button>
            {modulosList.map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setSelectedModulo(mod)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedModulo === mod
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Listado de Permisos Agrupados por Módulo */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-medium">Cargando matriz de permisos...</span>
        </div>
      ) : groupedPermissions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <EmptyState
            icon={Shield}
            title="Sin permisos que coincidan"
            description="No se encontraron permisos para los filtros seleccionados."
            actionLabel="Limpiar Filtros"
            onAction={() => {
              setSearchTerm('')
              setStatusFilter('TODOS')
              setSelectedModulo('TODOS')
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groupedPermissions.map(([modulo, perms]) => {
            const ModuleIcon = getModuleIcon(modulo)
            const grantedInModule = perms.filter((p) => hasPermission(p.codigo)).length

            return (
              <Card
                key={modulo}
                className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
              >
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ModuleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {modulo}
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500 dark:text-slate-400">
                          {perms.length} {perms.length === 1 ? 'permiso registrado' : 'permisos registrados'}
                        </CardDescription>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        grantedInModule === perms.length
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : grantedInModule > 0
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {grantedInModule} / {perms.length} activos
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                  {perms.map((permiso) => {
                    const isGranted = hasPermission(permiso.codigo)
                    return (
                      <div
                        key={permiso.id_permiso || permiso.codigo}
                        className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {isGranted ? (
                            <div className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="mt-0.5 w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {permiso.nombre}
                            </div>
                            {permiso.descripcion && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {permiso.descripcion}
                              </p>
                            )}
                            <code className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                              {permiso.codigo}
                            </code>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isGranted
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isGranted ? 'Concedido' : 'Restringido'}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

