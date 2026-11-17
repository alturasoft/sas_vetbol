import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { usePermissions } from '@/hooks/usePermissions'
import { publicacionesService } from '@/services/publicacionesService'
import type {
  Publicacion,
  PublicacionFormData,
  TipoPublicacion,
} from '@/types/publicacion'
import { toast } from '@/stores/useToastStore'
import { PublicacionCard } from './components/PublicacionCard'
import { PublicacionBadge, TIPO_PUBLICACION_CONFIG } from './components/PublicacionBadge'
import { PublicacionFormModal } from './components/PublicacionFormModal'
import { PublicacionDetailModal } from './components/PublicacionDetailModal'
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal'
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  Filter,
  Layers,
  AlertCircle,
  Inbox,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function PublicacionesPage() {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const { isAdmin, isSuperAdmin, hasPermission } = usePermissions()

  // Permiso de gestión: Administrador, Propietario o rol con ADMINISTRAR_PUBLICACIONES
  const canManage = isAdmin || isSuperAdmin || hasPermission('ADMINISTRAR_PUBLICACIONES')

  const idVeterinaria = user?.id_veterinaria || (currentTenant?.id_veterinaria ? Number(currentTenant.id_veterinaria) : null)

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTipo, setSelectedTipo] = useState<TipoPublicacion | 'TODOS'>('TODOS')
  const [selectedEstado, setSelectedEstado] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [publicacionToEdit, setPublicacionToEdit] = useState<Publicacion | null>(null)
  const [publicacionToView, setPublicacionToView] = useState<Publicacion | null>(null)
  const [publicacionToDelete, setPublicacionToDelete] = useState<Publicacion | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPublicaciones = useCallback(async () => {
    if (!idVeterinaria) return
    try {
      setIsLoading(true)
      const data = await publicacionesService.getPublicaciones(idVeterinaria)
      setPublicaciones(data)
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar las publicaciones del tablón')
    } finally {
      setIsLoading(false)
    }
  }, [idVeterinaria])

  useEffect(() => {
    fetchPublicaciones()
  }, [fetchPublicaciones])

  // Filtrado reactivo en memoria
  const filteredPublicaciones = useMemo(() => {
    return publicaciones.filter((p) => {
      // Filtro por tipo
      if (selectedTipo !== 'TODOS' && p.tipo !== selectedTipo) {
        return false
      }
      // Filtro por estado
      if (selectedEstado === 'ACTIVE' && !p.activo) {
        return false
      }
      if (selectedEstado === 'INACTIVE' && p.activo) {
        return false
      }
      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchTitulo = p.titulo?.toLowerCase().includes(query)
        const matchResumen = p.resumen?.toLowerCase().includes(query)
        const matchContenido = p.contenido?.toLowerCase().includes(query)
        if (!matchTitulo && !matchResumen && !matchContenido) {
          return false
        }
      }
      return true
    })
  }, [publicaciones, selectedTipo, selectedEstado, searchQuery])

  // Contadores de estadísticas
  const totalCount = publicaciones.length
  const activeCount = publicaciones.filter((p) => p.activo).length

  // Handlers
  const handleOpenCreate = () => {
    if (!canManage) {
      toast.warning('Sólo administradores o personal autorizado pueden crear publicaciones.')
      return
    }
    setPublicacionToEdit(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (pub: Publicacion) => {
    if (!canManage) return
    setPublicacionToEdit(pub)
    setIsFormOpen(true)
  }

  const handleSave = async (formData: PublicacionFormData, imageFile?: File | null) => {
    if (!idVeterinaria) {
      toast.error('No se ha detectado el identificador de la clínica veterinaria')
      return
    }

    try {
      setIsSaving(true)
      if (publicacionToEdit) {
        const updated = await publicacionesService.updatePublicacion(
          publicacionToEdit.id_publicacion,
          idVeterinaria,
          formData,
          imageFile,
          publicacionToEdit.imagen_url
        )
        setPublicaciones((prev) =>
          prev.map((item) => (item.id_publicacion === updated.id_publicacion ? updated : item))
        )
        toast.success('Publicación actualizada correctamente')
      } else {
        const created = await publicacionesService.createPublicacion(
          idVeterinaria,
          formData,
          imageFile
        )
        setPublicaciones((prev) => [created, ...prev])
        toast.success('Publicación creada y notificada exitosamente')
      }
      setIsFormOpen(false)
      setPublicacionToEdit(null)
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la publicación')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActivo = async (idPublicacion: number, nuevoEstado: boolean) => {
    if (!idVeterinaria) return
    try {
      await publicacionesService.toggleActivo(idPublicacion, idVeterinaria, nuevoEstado)
      setPublicaciones((prev) =>
        prev.map((item) =>
          item.id_publicacion === idPublicacion ? { ...item, activo: nuevoEstado } : item
        )
      )
      toast.success(
        nuevoEstado
          ? 'Publicación activada y visible para clientes'
          : 'Publicación desactivada y oculta'
      )
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado de la publicación')
    }
  }

  const handleConfirmDelete = async () => {
    if (!publicacionToDelete || !idVeterinaria) return
    try {
      setIsDeleting(true)
      await publicacionesService.deletePublicacion(
        publicacionToDelete.id_publicacion,
        idVeterinaria,
        publicacionToDelete.imagen_url
      )
      setPublicaciones((prev) =>
        prev.filter((p) => p.id_publicacion !== publicacionToDelete.id_publicacion)
      )
      toast.success('Publicación eliminada correctamente')
      setPublicacionToDelete(null)
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la publicación')
    } finally {
      setIsDeleting(false)
    }
  }

  const categorias = ['TODOS', ...Object.keys(TIPO_PUBLICACION_CONFIG)] as (TipoPublicacion | 'TODOS')[]

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Tablón de Anuncios y Noticias
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Publicaciones, campañas, vacunas y promociones visibles en la App móvil de clientes.
              </p>
            </div>
          </div>
        </div>

        {/* Header Stats & Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Total:</span>
            <span className="text-slate-900 dark:text-slate-100">{totalCount}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activeCount} activas</span>
          </div>

          <button
            type="button"
            onClick={fetchPublicaciones}
            title="Refrescar lista"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>

          {canManage ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Publicación</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Modo Lectura</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, contenido o resumen..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>

          {/* State Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectedEstado('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                selectedEstado === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setSelectedEstado('ACTIVE')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                selectedEstado === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              Vigentes
            </button>
            <button
              type="button"
              onClick={() => setSelectedEstado('INACTIVE')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                selectedEstado === 'INACTIVE'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              Inactivas
            </button>
          </div>
        </div>

        {/* Categories Horizontal Scroll / Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categorias.map((cat) => {
            const isSelected = selectedTipo === cat
            if (cat === 'TODOS') {
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedTipo('TODOS')}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Todos los tipos</span>
                </button>
              )
            }

            const cfg = TIPO_PUBLICACION_CONFIG[cat]
            const Icon = cfg.icon

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedTipo(cat)}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  isSelected
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Publicaciones Grid Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse"
            >
              <div className="h-44 bg-slate-200 dark:bg-slate-800" />
              <div className="p-5 space-y-3">
                <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="w-full h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPublicaciones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPublicaciones.map((pub) => (
            <PublicacionCard
              key={pub.id_publicacion}
              publicacion={pub}
              canManage={canManage}
              onView={(p) => setPublicacionToView(p)}
              onEdit={(p) => handleOpenEdit(p)}
              onDelete={(p) => setPublicacionToDelete(p)}
              onToggleActivo={handleToggleActivo}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <Inbox className="w-8 h-8 stroke-1" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No se encontraron publicaciones
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || selectedTipo !== 'TODOS' || selectedEstado !== 'ALL'
                ? 'No hay resultados que coincidan con los filtros aplicados. Intenta restablecer los filtros de búsqueda.'
                : 'Aún no has creado publicaciones o avisos para esta clínica veterinaria.'}
            </p>
          </div>

          {searchQuery || selectedTipo !== 'TODOS' || selectedEstado !== 'ALL' ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedTipo('TODOS')
                setSelectedEstado('ALL')
              }}
              className="px-4 py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 rounded-xl hover:bg-teal-100 transition-colors"
            >
              Restablecer filtros
            </button>
          ) : canManage ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear la primera publicación</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Modales */}
      <PublicacionDetailModal
        publicacion={publicacionToView}
        isOpen={!!publicacionToView}
        onClose={() => setPublicacionToView(null)}
      />

      <PublicacionFormModal
        isOpen={isFormOpen}
        publicacionToEdit={publicacionToEdit}
        isSaving={isSaving}
        onClose={() => {
          setIsFormOpen(false)
          setPublicacionToEdit(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        isOpen={!!publicacionToDelete}
        title="Eliminar Publicación"
        itemName={publicacionToDelete?.titulo || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPublicacionToDelete(null)}
      />
    </div>
  )
}
