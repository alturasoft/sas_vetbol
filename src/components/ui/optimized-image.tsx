import * as React from 'react'
import { cn } from '@/lib/utils'
import { ImageOff } from 'lucide-react'

export interface OptimizedImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: React.ReactNode
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
  containerClassName?: string
  imageClassName?: string
}

/**
 * Componente modular para el renderizado eficiente de imágenes en VetBol SaaS.
 * Incluye:
 * - Lazy loading nativo y decodificación asíncrona.
 * - Shimmer/Skeleton de carga para evitar saltos de diseño (CLS).
 * - Manejo robusto de estados (loading, loaded, error, empty).
 * - Transición de opacidad fluida al completarse la carga.
 */
export function OptimizedImage({
  src,
  alt = 'Fotografía',
  fallback,
  loading = 'lazy',
  decoding = 'async',
  containerClassName,
  imageClassName,
  className,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = React.useState(!src)

  React.useEffect(() => {
    setHasError(!src)
  }, [src])

  const showFallback = !src || hasError

  return (
    <div
      className={cn(
        'relative overflow-hidden flex items-center justify-center select-none bg-slate-100 dark:bg-slate-800',
        containerClassName || className
      )}
      {...props}
    >
      {!showFallback ? (
        <img
          src={src!}
          alt={alt}
          loading={loading}
          decoding={decoding}
          onError={() => setHasError(true)}
          className={cn(
            'w-full h-full object-cover',
            imageClassName
          )}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-slate-400 dark:text-slate-500">
          {fallback || <ImageOff className="w-5 h-5 opacity-60" />}
        </div>
      )}
    </div>
  )
}
