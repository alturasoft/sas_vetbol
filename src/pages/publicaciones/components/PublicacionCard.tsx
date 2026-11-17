import { useState } from 'react'
import type { Publicacion } from '@/types/publicacion'
import { PublicacionBadge } from './PublicacionBadge'
import {
  Calendar,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  PhoneCall,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PublicacionCardProps {
  publicacion: Publicacion
  canManage: boolean
  onView: (publicacion: Publicacion) => void
  onEdit: (publicacion: Publicacion) => void
  onDelete: (publicacion: Publicacion) => void
  onToggleActivo: (idPublicacion: number, nuevoEstado: boolean) => Promise<void>
}

export function PublicacionCard({
  publicacion,
  canManage,
  onView,
  onEdit,
  onDelete,
  onToggleActivo,
}: PublicacionCardProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canManage || isToggling) return
    try {
      setIsToggling(true)
      await onToggleActivo(publicacion.id_publicacion, !publicacion.activo)
    } finally {
      setIsToggling(false)
    }
  }

  const formattedDate = publicacion.created_at
    ? new Date(publicacion.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Reciente'

  return (
    <div
      onClick={() => onView(publicacion)}
      className={cn(
        'group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
        publicacion.activo
          ? 'border-slate-200 dark:border-slate-800'
          : 'border-slate-200/60 dark:border-slate-800/60 opacity-80 hover:opacity-100 bg-slate-50/50 dark:bg-slate-900/40'
      )}
    >
      <div>
        {/* Card Header Image Preview */}
        <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          {publicacion.imagen_url && !imgError ? (
            <img
              src={publicacion.imagen_url}
              alt={publicacion.titulo}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 text-slate-400 dark:text-slate-500">
              <ImageIcon className="w-8 h-8 stroke-1" />
              <span className="text-[11px] font-medium mt-1">Sin imagen</span>
            </div>
          )}

          {/* Badge Top Left */}
          <div className="absolute top-3 left-3 z-10">
            <PublicacionBadge tipo={publicacion.tipo} size="sm" />
          </div>

          {/* Active Switch Top Right */}
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              disabled={!canManage || isToggling}
              onClick={handleToggle}
              title={
                canManage
                  ? publicacion.activo
                    ? 'Click para Desactivar'
                    : 'Click para Activar'
                  : 'Estado de publicación'
              }
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-xs',
                publicacion.activo
                  ? 'bg-emerald-600/90 text-white hover:bg-emerald-700'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-900',
                !canManage && 'cursor-default'
              )}
            >
              {isToggling ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    publicacion.activo ? 'bg-emerald-300 animate-pulse' : 'bg-slate-400'
                  )}
                />
              )}
              <span>{publicacion.activo ? 'Vigente' : 'Inactivo'}</span>
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {publicacion.titulo}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {publicacion.resumen || publicacion.contenido || 'Sin descripción detallada.'}
          </p>

          {/* Action CTA indicator if available */}
          {publicacion.boton_texto && (
            <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
              {publicacion.boton_texto.toLowerCase().includes('llamar') ? (
                <PhoneCall className="w-3 h-3" />
              ) : (
                <ExternalLink className="w-3 h-3" />
              )}
              <span>CTA: {publicacion.boton_texto}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onView(publicacion)
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ver Detalle</span>
        </button>

        {canManage && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(publicacion)
              }}
              title="Editar publicación"
              className="p-1.5 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(publicacion)
              }}
              title="Eliminar publicación"
              className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
