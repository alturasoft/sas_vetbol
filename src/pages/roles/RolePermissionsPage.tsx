import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  Shield,
  Crown,
  Lock,
  CheckSquare,
  Square,
  RotateCcw,
  Search,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  KeyRound,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/EmptyState'
import { RolesService } from '@/services/roles.service'
import { ROLE_DEFAULT_PERMISSIONS } from '@/lib/permissions'
import { toast } from '@/stores/useToastStore'
import { getModuleIcon } from './VisorPermisosPage'
import type { PermisoRBAC, RolRBAC } from '@/types/staff.types'

export function RolePermissionsPage() {
  const { idRol } = useParams<{ idRol: string }>()
  const navigate = useNavigate()

  const [rol, setRol] = useState<RolRBAC | null>(null)
  const [nombreEdit, setNombreEdit] = useState('')
  const [descripcionEdit, setDescripcionEdit] = useState('')
  const [allPermissions, setAllPermissions] = useState<PermisoRBAC[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [initialIds, setInitialIds] = useState<Set<number>>(new Set())

  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const rolIdNum = Number(idRol)

  useEffect(() => {
    if (rolIdNum && !isNaN(rolIdNum)) {
      loadRoleAndPermissions(rolIdNum)
    }
  }, [rolIdNum])

  const loadRoleAndPermissions = async (targetRolId: number) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [rolData, catalogData, rolePermsData] = await Promise.all([
        RolesService.getRolById(targetRolId),
        RolesService.getPermisos(),
        RolesService.getPermisosDelRol(targetRolId),
      ])

      if (!rolData) {
        setErrorMsg('No se encontró el rol solicitado o no pertenece a tu clínica activa.')
        setIsLoading(false)
        return
      }

      setRol(rolData)
      setNombreEdit(rolData.nombre)
      setDescripcionEdit(rolData.descripcion || '')
      setAllPermissions(catalogData)

      // Construir el Set inicial de id_permiso activos para el rol
      const activeSet = new Set<number>()
      if (rolData.nombre.trim().toUpperCase() === 'ADMINISTRADOR') {
        catalogData.forEach((p) => activeSet.add(p.id_permiso))
      } else {
        const grantedCodes = new Set(rolePermsData.map((p) => p.codigo.trim().toUpperCase()))
        const grantedIds = new Set(rolePermsData.map((p) => p.id_permiso))

        catalogData.forEach((p) => {
          if (grantedIds.has(p.id_permiso) || grantedCodes.has(p.codigo.trim().toUpperCase())) {
            activeSet.add(p.id_permiso)
          }
        })
      }

      setSelectedIds(new Set(activeSet))
      setInitialIds(new Set(activeSet))
    } catch (err: any) {
      console.error('Error al cargar permisos del rol:', err)
      setErrorMsg(err?.message || 'No se pudo cargar la configuración de permisos del rol.')
    } finally {
      setIsLoading(false)
    }
  }

  const isSystemAdmin = rol?.nombre.trim().toUpperCase() === 'ADMINISTRADOR'
  const isSystemRole = !!rol?.es_sistema

  // Detectar si hubo cambios pendientes por guardar
  const hasUnsavedChanges = useMemo(() => {
    if (!rol || isSystemAdmin) return false
    if (nombreEdit.trim().toUpperCase() !== rol.nombre) return true
    if ((descripcionEdit.trim() || '') !== (rol.descripcion || '')) return true
    if (selectedIds.size !== initialIds.size) return true
    for (const id of selectedIds) {
      if (!initialIds.has(id)) return true
    }
    return false
  }, [rol, isSystemAdmin, nombreEdit, descripcionEdit, selectedIds, initialIds])

  // Agrupación de permisos por módulo
  const groupedPermissions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = allPermissions.filter((p) => {
      if (!term) return true
      return (
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        p.modulo.toLowerCase().includes(term) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term))
      )
    })

    const map = new Map<string, PermisoRBAC[]>()
    filtered.forEach((p) => {
      const list = map.get(p.modulo) || []
      list.push(p)
      map.set(p.modulo, list)
    })

    return Array.from(map.entries())
  }, [allPermissions, searchTerm])

  // Alternar un permiso individual
  const handleTogglePermiso = (idPermiso: number) => {
    if (isSystemAdmin) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(idPermiso)) {
        next.delete(idPermiso)
      } else {
        next.add(idPermiso)
      }
      return next
    })
  }

  // Alternar todos los permisos de un módulo específico
  const handleToggleModule = (permsInModule: PermisoRBAC[]) => {
    if (isSystemAdmin) return
    const allSelected = permsInModule.every((p) => selectedIds.has(p.id_permiso))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        permsInModule.forEach((p) => next.delete(p.id_permiso))
      } else {
        permsInModule.forEach((p) => next.add(p.id_permiso))
      }
      return next
    })
  }

  // Seleccionar o desmarcar todo el catálogo
  const handleSelectAll = (selectAll: boolean) => {
    if (isSystemAdmin) return
    if (selectAll) {
      setSelectedIds(new Set(allPermissions.map((p) => p.id_permiso)))
    } else {
      setSelectedIds(new Set())
    }
  }

  // Restaurar permisos predeterminados si es un rol de sistema conocido
  const handleRestoreDefaults = () => {
    if (!rol || isSystemAdmin) return
    const defaults = ROLE_DEFAULT_PERMISSIONS[rol.nombre.trim().toUpperCase()]
    if (!defaults) return

    const codeSet = new Set(defaults.map((c) => c.toUpperCase()))
    const nextIds = new Set<number>()
    allPermissions.forEach((p) => {
      if (codeSet.has(p.codigo.toUpperCase())) {
        nextIds.add(p.id_permiso)
      }
    })
    setSelectedIds(nextIds)
    toast.info(
      'Plantilla Aplicada',
      `Se marcaron los permisos recomendados para el rol ${rol.nombre}. Presiona "Guardar Permisos" para confirmar.`
    )
  }

  // Guardar cambios en base de datos (Reemplazo Atómico DELETE + bulk INSERT)
  const handleSavePermissions = async () => {
    if (!rol || isSystemAdmin) return

    const cleanName = nombreEdit.trim().toUpperCase()
    if (!cleanName) {
      toast.error('Nombre Requerido', 'El nombre del rol no puede quedar vacío.')
      return
    }

    setIsSaving(true)
    try {
      const updatedRol: RolRBAC = {
        ...rol,
        nombre: isSystemRole ? rol.nombre : cleanName,
        descripcion: descripcionEdit.trim() || null,
      }

      const idsArray = Array.from(selectedIds)
      await RolesService.updateRolPermisos(updatedRol, idsArray)

      setRol({
        ...updatedRol,
        cant_permisos: idsArray.length,
        cantPermisos: idsArray.length,
      })
      setInitialIds(new Set(selectedIds))

      toast.success(
        'Permisos Guardados',
        `Se actualizaron ${idsArray.length} permisos para el rol "${updatedRol.nombre}" y se sincronizó la sesión.`
      )
    } catch (err: any) {
      console.error('Error al guardar permisos del rol:', err)
      toast.error('Error al Guardar', err?.message || 'No se pudieron guardar los permisos del rol.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="text-xs font-medium">Cargando matriz de permisos del rol...</span>
      </div>
    )
  }

  if (errorMsg || !rol) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertCircle}
          title="Rol no disponible"
          description={errorMsg || 'No se encontró el rol solicitado.'}
          actionLabel="Volver a Roles"
          onAction={() => navigate('/roles')}
        />
      </div>
    )
  }

  const totalCount = allPermissions.length
  const checkedCount = isSystemAdmin ? totalCount : selectedIds.size
  const hasDefaultTemplate =
    !isSystemAdmin && !!ROLE_DEFAULT_PERMISSIONS[rol.nombre.trim().toUpperCase()]

  return (
    <div className="space-y-6">
      {/* 1. Header de Navegación y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/roles">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 shrink-0 cursor-pointer dark:border-slate-800 dark:text-slate-300"
              title="Volver al listado de roles"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Permisos del Rol: {rol.nombre}
              </h1>
              {isSystemRole ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Rol de Sistema
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Rol Personalizado
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isSystemAdmin
                ? 'Vista de solo lectura para el rol superusuario de la clínica.'
                : 'Activa o revoca los permisos granulares por módulo para todos los miembros con este rol.'}
            </p>
          </div>
        </div>

        {/* Regla 1: El botón "Guardar Permisos" se oculta cuando rol.nombre === 'ADMINISTRADOR' */}
        {!isSystemAdmin && (
          <div className="flex items-center gap-3 self-end sm:self-center">
            {hasUnsavedChanges && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Cambios sin guardar
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando Permisos...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Permisos ({checkedCount})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* 2. Alerta de Superusuario Incondicional si es ADMINISTRADOR */}
      {isSystemAdmin ? (
        <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-black text-amber-950 dark:text-amber-200 text-sm">
              Superusuario Incondicional (Acceso Total Protegido)
            </h3>
            <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
              Por seguridad arquitectónica del sistema, el rol <strong>ADMINISTRADOR</strong> posee todos los permisos concedidos de forma permanente e incondicional. Sus interruptores se encuentran bloqueados para evitar bloqueos accidentales (anti-lockout) en la clínica.
            </p>
          </div>
        </div>
      ) : (
        /* Datos editables del rol para roles distintos de ADMINISTRADOR */
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Nombre del Rol {isSystemRole && <span className="text-[10px] text-slate-400">(Fijo por sistema)</span>}
                </label>
                <Input
                  value={nombreEdit}
                  onChange={(e) => setNombreEdit(e.target.value.toUpperCase())}
                  disabled={isSystemRole}
                  className="text-xs font-bold uppercase dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Descripción del Rol
                </label>
                <Input
                  value={descripcionEdit}
                  onChange={(e) => setDescripcionEdit(e.target.value)}
                  placeholder="Descripción del perfil y alcance operativo..."
                  className="text-xs dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Barra de Herramientas y Selección Rápida */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar permisos por nombre, código o módulo..."
            className="pl-9 text-xs dark:bg-slate-950/50 dark:border-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-xs">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {checkedCount} / {totalCount} seleccionados
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {rol.cantUsuarios} {rol.cantUsuarios === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>

          {!isSystemAdmin && (
            <div className="flex items-center gap-2">
              {hasDefaultTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRestoreDefaults}
                  className="gap-1.5 text-xs cursor-pointer dark:border-slate-800 dark:text-slate-300"
                  title="Cargar permisos sugeridos para este rol de sistema"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Sugeridos
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(true)}
                className="gap-1.5 text-xs cursor-pointer dark:border-slate-800 dark:text-slate-300"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                Todos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(false)}
                className="gap-1.5 text-xs cursor-pointer dark:border-slate-800 dark:text-slate-300"
              >
                <Square className="w-3.5 h-3.5 text-slate-400" />
                Ninguno
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Grid de Módulos y Switches de Permisos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groupedPermissions.map(([modulo, perms]) => {
          const ModuleIcon = getModuleIcon(modulo)
          const activeInModule = perms.filter(
            (p) => isSystemAdmin || selectedIds.has(p.id_permiso)
          ).length
          const allModuleChecked = activeInModule === perms.length

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
                        {activeInModule} de {perms.length} permisos habilitados
                      </CardDescription>
                    </div>
                  </div>

                  {!isSystemAdmin && (
                    <button
                      type="button"
                      onClick={() => handleToggleModule(perms)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        allModuleChecked
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {allModuleChecked ? 'Desmarcar módulo' : 'Marcar módulo'}
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                {perms.map((permiso) => {
                  // Regla 1: isChecked = isSystemAdmin || selectedIds.has(permiso.id_permiso)
                  const isChecked = isSystemAdmin || selectedIds.has(permiso.id_permiso)

                  return (
                    <div
                      key={permiso.id_permiso}
                      onClick={() => {
                        if (!isSystemAdmin) handleTogglePermiso(permiso.id_permiso)
                      }}
                      className={`py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 rounded-lg transition-colors ${
                        isSystemAdmin ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 -mx-2'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {permiso.nombre}
                          </span>
                          <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                            {permiso.codigo}
                          </code>
                        </div>
                        {permiso.descripcion && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {permiso.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Switch de Permiso (Deshabilitado cuando rol.nombre === 'ADMINISTRADOR') */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        disabled={isSystemAdmin}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePermiso(permiso.id_permiso)
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          isChecked
                            ? 'bg-emerald-600'
                            : 'bg-slate-300 dark:bg-slate-700'
                        } ${
                          isSystemAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            isChecked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 5. Footer de Guardado (Oculto para ADMINISTRADOR) */}
      {!isSystemAdmin && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Rol: <strong className="text-slate-900 dark:text-slate-100">{rol.nombre}</strong> •{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">{checkedCount}</strong> permisos activos
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/roles')}
              disabled={isSaving}
              className="text-xs cursor-pointer dark:border-slate-800 dark:text-slate-300"
            >
              Volver a Roles
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Permisos
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

