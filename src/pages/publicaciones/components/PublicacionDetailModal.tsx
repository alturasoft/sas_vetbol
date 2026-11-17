import { useState } from 'react'
import type { Publicacion } from '@/types/publicacion'
import { PublicacionBadge } from './PublicacionBadge'
import {
  X,
  ExternalLink,
  PhoneCall,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Maximize2,
} from 'lucide-react'

interface PublicacionDetailModalProps {
  publicacion: Publicacion | null
  isOpen: boolean
  onClose: () => void
}

export function PublicacionDetailModal({
  publicacion,
  isOpen,
  onClose,
}: PublicacionDetailModalProps) {
  const [showFullImage, setShowFullImage] = useState(false)

  if (!isOpen || !publicacion) return null

  const formattedDate = publicacion.created_at
    ? new Date(publicacion.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Reciente'

  const handleActionClick = () => {
    if (!publicacion.boton_accion) return

    if (publicacion.boton_texto?.toLowerCase().includes('llamar') || /^\+?[0-9]+$/.test(publicacion.boton_accion.replace(/\s+/g, ''))) {
      const cleanPhone = publicacion.boton_accion.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank', 'noopener,noreferrer')
    } else {
      let url = publicacion.boton_accion
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
          {/* Header Image or Gradient Banner */}
          <div className="relative h-64 sm:h-72 w-full bg-slate-800 overflow-hidden group">
            {publicacion.imagen_url ? (
              <>
                <img
                  src={publicacion.imagen_url}
                  alt={publicacion.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                <button
                  type="button"
                  onClick={() => setShowFullImage(true)}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-md transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ver imagen</span>
                </button>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 flex items-center justify-center">
                <div className="text-center p-6 space-y-2">
                  <PublicacionBadge tipo={publicacion.tipo} size="lg" />
                  <p className="text-white/80 text-xs font-medium">Publicación de la Clínica</p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PublicacionBadge tipo={publicacion.tipo} size="md" />
                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {publicacion.activo ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Visible para Clientes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <XCircle className="w-4 h-4" />
                    Inactivo (Oculto)
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {publicacion.titulo}
            </h2>

            {/* Excerpt */}
            {publicacion.resumen && (
              <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border-l-4 border-teal-500 text-sm italic text-slate-700 dark:text-slate-300">
                "{publicacion.resumen}"
              </div>
            )}

            {/* Main Rich Content */}
            {publicacion.contenido ? (
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed space-y-4">
                {publicacion.contenido}
              </div>
            ) : (
              !publicacion.resumen && (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                  Sin contenido adicional para esta publicación.
                </p>
              )
            )}

            {/* Call To Action Button (CTA) */}
            {publicacion.boton_texto && publicacion.boton_accion && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
                >
                  {publicacion.boton_texto.toLowerCase().includes('llamar') ? (
                    <PhoneCall className="w-4 h-4" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  <span>{publicacion.boton_texto}</span>
                  <span className="text-xs font-normal opacity-80">({publicacion.boton_accion})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {showFullImage && publicacion.imagen_url && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            type="button"
            onClick={() => setShowFullImage(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={publicacion.imagen_url}
            alt={publicacion.titulo}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
