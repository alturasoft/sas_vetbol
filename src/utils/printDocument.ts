/**
 * Utilidad reutilizable para impresión y exportación de documentos médicos,
 * recetas, órdenes de laboratorio y reportes en VetBol SaaS.
 *
 * Utiliza un iframe aislado para asegurar que ÚNICAMENTE se imprima el documento
 * objetivo, sin barras de navegación, botones, scrollbars ni bordes de la aplicación.
 */

export interface PrintDocumentOptions {
  /**
   * Elemento HTML o ID del elemento contenedor a imprimir (ej: 'medical-record-print-sheet').
   */
  target: HTMLElement | string
  /**
   * Título del documento que aparecerá como nombre de archivo al "Guardar como PDF".
   */
  documentTitle?: string
  /**
   * Orientación del papel. Por defecto 'portrait'.
   */
  pageOrientation?: 'portrait' | 'landscape'
  /**
   * Tamaño del papel. Por defecto 'letter' (Carta), compatible con 'a4'.
   */
  pageSize?: 'letter' | 'a4'
  /**
   * Márgenes en milímetros. Por defecto '10mm 12mm'.
   */
  pageMargin?: string
  /**
   * Estilos CSS adicionales específicos a inyectar en el documento de impresión.
   */
  customStyles?: string
}

export function printDocument({
  target,
  documentTitle = 'Documento_VetBol',
  pageOrientation = 'portrait',
  pageSize = 'letter',
  pageMargin = '10mm 12mm',
  customStyles = '',
}: PrintDocumentOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // 1. Obtener el elemento objetivo
    const element = typeof target === 'string' ? document.getElementById(target) : target

    if (!element) {
      console.warn(`[printDocument] No se encontró el elemento objetivo para imprimir:`, target)
      // Fallback a window.print()
      window.print()
      resolve(false)
      return
    }

    // 2. Extraer todos los estilos (Tailwind, fuentes Google Fonts, hojas externas e internas)
    const headStyles: string[] = []

    // Enlaces a hojas de estilo externas (fonts, etc.)
    const linkTags = document.querySelectorAll('link[rel="stylesheet"]')
    linkTags.forEach((link) => {
      headStyles.push(link.outerHTML)
    })

    // Hojas de estilo internas compiladas por Vite / Tailwind v4
    const styleTags = document.querySelectorAll('style')
    styleTags.forEach((style) => {
      headStyles.push(style.outerHTML)
    })

    // 3. Crear iframe invisible aislado
    const iframe = document.createElement('iframe')
    iframe.id = 'vetbol-print-iframe'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.overflow = 'hidden'
    iframe.style.visibility = 'hidden'

    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) {
      console.error('[printDocument] No se pudo acceder al documento del iframe.')
      document.body.removeChild(iframe)
      window.print()
      resolve(false)
      return
    }

    // Nombre para el archivo PDF
    const cleanTitle = documentTitle.replace(/[^a-zA-Z0-9_\-\.]/g, '_')

    // Estilos base de impresión que resuelven los problemas de márgenes y colores
    const basePrintStyles = `
      @page {
        size: ${pageSize} ${pageOrientation};
        margin: ${pageMargin};
      }

      *, *::before, *::after {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }

      /* Contenedor principal de impresión a ancho completo limpio */
      .print-root-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }

      /* Utilidades para controlar cortes de página */
      .print-avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      .print-force-break {
        break-before: page !important;
        page-break-before: always !important;
      }

      /* Anular bordes o fondos externos innecesarios en la hoja clínica */
      #medical-record-print-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 auto !important;
        max-width: 100% !important;
      }

      ${customStyles}
    `

    // 4. Escribir el documento en el iframe
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>${cleanTitle}</title>
          ${headStyles.join('\n')}
          <style>${basePrintStyles}</style>
        </head>
        <body class="bg-white text-slate-900">
          <div class="print-root-container">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `)
    iframeDoc.close()

    // 5. Esperar a que se procesen los estilos y fuentes antes de lanzar la impresión
    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (err) {
        console.error('[printDocument] Error al ejecutar print en el iframe:', err)
      } finally {
        // Remover el iframe después de completar el diálogo
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe)
          }
          resolve(true)
        }, 1000)
      }
    }

    // Si hay imágenes o fuentes externas en el iframe, esperar a que carguen
    if (iframe.contentWindow) {
      iframe.contentWindow.onload = () => {
        setTimeout(triggerPrint, 250)
      }
      // Salvaguarda por si onload ya disparó
      setTimeout(triggerPrint, 400)
    } else {
      setTimeout(triggerPrint, 300)
    }
  })
}
