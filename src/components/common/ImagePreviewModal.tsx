import { useEffect } from 'react'
import { X, ExternalLink, Download } from 'lucide-react'

interface ImagePreviewModalProps {
  isOpen: boolean
  imageUrl: string | null
  title?: string
  subtitle?: string
  onClose: () => void
  zIndexClassName?: string
}

export function ImagePreviewModal({
  isOpen,
  imageUrl,
  title,
  subtitle,
  onClose,
  zIndexClassName = 'z-[70]',
}: ImagePreviewModalProps) {
  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Visualización de imagen'}
    >
      <div
        className="relative max-w-4xl w-full flex flex-col items-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior flotante */}
        <div className="w-full flex items-center justify-between px-4 py-3 mb-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white backdrop-blur-sm shadow-lg">
          <div className="flex flex-col">
            {title && <span className="text-sm font-bold text-slate-100">{title}</span>}
            {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Abrir imagen original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
              aria-label="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor de la Imagen Grande Flotante */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-black/40 flex items-center justify-center max-h-[80vh]">
          <img
            src={imageUrl}
            alt={title || 'Fotografía ampliada'}
            className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl select-none"
          />
        </div>
      </div>
    </div>
  )
}
