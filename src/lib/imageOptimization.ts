/**
 * Utilidad para la compresión y optimización de imágenes en el cliente (Browser).
 * Reduce drásticamente el peso de fotos capturadas con smartphones o cámaras
 * convirtiéndolas a WebP de alta fidelidad, ideal para avatares y perfiles.
 */

export interface OptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'image/webp' | 'image/jpeg'
}

export interface OptimizedImageResult {
  file: File
  previewUrl: string
  originalSize: number
  optimizedSize: number
  savedPercentage: number
  width: number
  height: number
}

/**
 * Formatea bytes en una representación legible (ej. 2.4 MB, 85 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Optimiza y redimensiona una imagen en memoria utilizando Canvas HTML5.
 * Preserva la relación de aspecto sin sobre-escalar imágenes pequeñas.
 */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.82,
    format = 'image/webp',
  } = options

  // Si no es un archivo de imagen, rechazar de inmediato
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.')
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      // Liberar URL temporal original
      URL.revokeObjectURL(objectUrl)

      try {
        let { width, height } = img

        // Calcular escalado proporcional sin aumentar imágenes pequeñas
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Crear canvas para el renderizado optimizado
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) {
          throw new Error('No se pudo inicializar el contexto 2D para optimizar la imagen.')
        }

        // Filtro bicúbico de alta calidad para suavizado
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Comprobar soporte de WebP y exportar
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback a JPEG si WebP fallase
              canvas.toBlob(
                (fallbackBlob) => {
                  if (!fallbackBlob) {
                    reject(new Error('Fallo crítico al comprimir la imagen.'))
                    return
                  }
                  finalize(fallbackBlob, 'image/jpeg', 'jpg')
                },
                'image/jpeg',
                quality
              )
              return
            }
            finalize(blob, format, 'webp')
          },
          format,
          quality
        )

        function finalize(blob: Blob, mimeType: string, extension: string) {
          // Generar nombre de archivo normalizado
          const originalName = file.name.replace(/\.[^/.]+$/, '')
          const cleanName = `${originalName.replace(/\s+/g, '_').toLowerCase()}_optimized.${extension}`

          const optimizedFile = new File([blob], cleanName, {
            type: mimeType,
            lastModified: Date.now(),
          })

          const previewUrl = URL.createObjectURL(blob)
          const originalSize = file.size
          const optimizedSize = optimizedFile.size
          const savedPercentage = originalSize > 0
            ? Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100))
            : 0

          resolve({
            file: optimizedFile,
            previewUrl,
            originalSize,
            optimizedSize,
            savedPercentage,
            width,
            height,
          })
        }
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo decodificar la imagen proporcionada.'))
    }

    img.src = objectUrl
  })
}
