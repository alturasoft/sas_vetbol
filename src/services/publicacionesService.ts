import { supabase } from '@/config/supabase'
import { assertPermission } from '@/lib/permissions'
import type { Publicacion, PublicacionFormData, PublicacionFilters } from '@/types/publicacion'

/**
 * Comprime y convierte una imagen seleccionada a formato WebP usando Canvas del navegador.
 */
export async function compressImageToWebp(file: File, quality = 0.8, maxWidth = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let width = img.naturalWidth
      let height = img.naturalHeight

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D del Canvas'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            // Fallback a file original si toBlob(image/webp) no está soportado
            resolve(file)
          }
        },
        'image/webp',
        quality
      )
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }

    img.src = url
  })
}

/**
 * Extrae la ruta interna del Storage de Supabase a partir de la URL pública.
 */
export function extractStoragePathFromUrl(imageUrl: string, bucket = 'publicaciones'): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = imageUrl.indexOf(marker)
    if (index !== -1) {
      return imageUrl.substring(index + marker.length)
    }
    return null
  } catch {
    return null
  }
}

export const publicacionesService = {
  /**
   * Obtiene la lista de publicaciones para la veterinaria activa.
   */
  async getPublicaciones(
    idVeterinaria: number,
    filters?: PublicacionFilters
  ): Promise<Publicacion[]> {
    let query = supabase
      .from('publicaciones')
      .select('*')
      .eq('id_veterinaria', idVeterinaria)

    if (filters?.tipo && filters.tipo !== 'TODOS') {
      query = query.eq('tipo', filters.tipo)
    }

    if (filters?.activo === 'ACTIVE') {
      query = query.eq('activo', true)
    } else if (filters?.activo === 'INACTIVE') {
      query = query.eq('activo', false)
    }

    if (filters?.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`
      query = query.or(`titulo.ilike.${term},resumen.ilike.${term}`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener publicaciones:', error)
      throw new Error(error.message || 'Error al obtener publicaciones')
    }

    return (data || []) as unknown as Publicacion[]
  },

  /**
   * Sube una imagen al bucket público 'publicaciones' y retorna la URL pública.
   */
  async uploadImage(idVeterinaria: number, file: File): Promise<string> {
    const compressedBlob = await compressImageToWebp(file, 0.8)
    const timestamp = Date.now()
    const filePath = `${idVeterinaria}/${timestamp}.webp`

    const { error: uploadError } = await supabase.storage
      .from('publicaciones')
      .upload(filePath, compressedBlob, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      })

    if (uploadError) {
      console.error('Error al subir imagen a Supabase Storage:', uploadError)
      throw new Error(uploadError.message || 'Error al subir la imagen')
    }

    const { data: publicData } = supabase.storage
      .from('publicaciones')
      .getPublicUrl(filePath)

    return publicData.publicUrl
  },

  /**
   * Elimina una imagen del bucket público 'publicaciones'.
   */
  async deleteImageByUrl(imageUrl: string): Promise<void> {
    const path = extractStoragePathFromUrl(imageUrl, 'publicaciones')
    if (path) {
      const { error } = await supabase.storage
        .from('publicaciones')
        .remove([path])

      if (error) {
        console.warn('No se pudo eliminar la imagen previa en Storage:', error)
      }
    }
  },

  /**
   * Crea una nueva publicación en la base de datos.
   */
  async createPublicacion(
    idVeterinaria: number,
    formData: PublicacionFormData,
    imageFile?: File | null
  ): Promise<Publicacion> {
    assertPermission('ADMINISTRAR_PUBLICACIONES', 'crear anuncios y publicaciones')

    let finalImageUrl: string | null = formData.imagen_url || null

    if (imageFile) {
      finalImageUrl = await this.uploadImage(idVeterinaria, imageFile)
    }

    const payload = {
      id_veterinaria: idVeterinaria,
      tipo: formData.tipo,
      titulo: formData.titulo.trim(),
      resumen: formData.resumen.trim() || null,
      contenido: formData.contenido.trim() || null,
      imagen_url: finalImageUrl,
      boton_texto: formData.botonTipo !== 'NONE' && formData.boton_texto.trim() ? formData.boton_texto.trim() : null,
      boton_accion: formData.botonTipo !== 'NONE' && formData.boton_accion.trim() ? formData.boton_accion.trim() : null,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      activo: formData.activo,
    }

    const { data, error } = await supabase
      .from('publicaciones')
      .insert(payload)
      .select()
      .single()

    if (error) {
      // Si falla la inserción y subimos imagen, intentar limpiar la imagen subida
      if (imageFile && finalImageUrl) {
        await this.deleteImageByUrl(finalImageUrl).catch(() => {})
      }
      console.error('Error al insertar publicación:', error)
      throw new Error(error.message || 'Error al crear la publicación')
    }

    return data as unknown as Publicacion
  },

  /**
   * Actualiza una publicación existente.
   */
  async updatePublicacion(
    idPublicacion: number,
    idVeterinaria: number,
    formData: PublicacionFormData,
    newImageFile?: File | null,
    previousImageUrl?: string | null
  ): Promise<Publicacion> {
    assertPermission('ADMINISTRAR_PUBLICACIONES', 'modificar anuncios y publicaciones')

    let finalImageUrl: string | null = formData.imagen_url || null

    if (newImageFile) {
      finalImageUrl = await this.uploadImage(idVeterinaria, newImageFile)
      // Si se subió una nueva imagen con éxito y existía una previa distinta, eliminar la antigua
      if (previousImageUrl && previousImageUrl !== finalImageUrl) {
        await this.deleteImageByUrl(previousImageUrl).catch(() => {})
      }
    } else if (previousImageUrl && !formData.imagen_url) {
      // Si el usuario removió la imagen
      await this.deleteImageByUrl(previousImageUrl).catch(() => {})
      finalImageUrl = null
    }

    const payload = {
      tipo: formData.tipo,
      titulo: formData.titulo.trim(),
      resumen: formData.resumen.trim() || null,
      contenido: formData.contenido.trim() || null,
      imagen_url: finalImageUrl,
      boton_texto: formData.botonTipo !== 'NONE' && formData.boton_texto.trim() ? formData.boton_texto.trim() : null,
      boton_accion: formData.botonTipo !== 'NONE' && formData.boton_accion.trim() ? formData.boton_accion.trim() : null,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      activo: formData.activo,
    }

    const { data, error } = await supabase
      .from('publicaciones')
      .update(payload)
      .eq('id_publicacion', idPublicacion)
      .eq('id_veterinaria', idVeterinaria)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar publicación:', error)
      throw new Error(error.message || 'Error al actualizar la publicación')
    }

    return data as unknown as Publicacion
  },

  /**
   * Cambia rápidamente el estado activo/inactivo de una publicación.
   */
  async toggleActivo(
    idPublicacion: number,
    idVeterinaria: number,
    nuevoEstado: boolean
  ): Promise<void> {
    assertPermission('ADMINISTRAR_PUBLICACIONES', 'cambiar visibilidad de publicaciones')

    const { error } = await supabase
      .from('publicaciones')
      .update({ activo: nuevoEstado })
      .eq('id_publicacion', idPublicacion)
      .eq('id_veterinaria', idVeterinaria)

    if (error) {
      console.error('Error al cambiar estado activo:', error)
      throw new Error(error.message || 'Error al cambiar estado de la publicación')
    }
  },

  /**
   * Elimina físicamente una publicación y su imagen asociada.
   */
  async deletePublicacion(
    idPublicacion: number,
    idVeterinaria: number,
    imagenUrl?: string | null
  ): Promise<void> {
    assertPermission('ADMINISTRAR_PUBLICACIONES', 'eliminar anuncios y publicaciones')

    const { error } = await supabase
      .from('publicaciones')
      .delete()
      .eq('id_publicacion', idPublicacion)
      .eq('id_veterinaria', idVeterinaria)

    if (error) {
      console.error('Error al eliminar publicación:', error)
      throw new Error(error.message || 'Error al eliminar la publicación')
    }

    if (imagenUrl) {
      await this.deleteImageByUrl(imagenUrl).catch(() => {})
    }
  },
}
