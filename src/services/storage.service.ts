import { supabase } from '@/config/supabase'

export const storageService = {
  /**
   * Garantiza que exista una sesión activa en Supabase Auth
   * para cumplir con las políticas RLS del storage.
   */
  async ensureAuthenticatedSession(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('Operación de storage solicitada sin una sesión activa en Supabase Auth.')
    }
  },

  /**
   * Sube una foto de cliente al bucket 'clientes-fotos' de Supabase Storage.
   * Organiza las fotos bajo el prefijo del tenant: {id_veterinaria}/{nombre_archivo}
   * 
   * @param file Archivo o Blob de la imagen (preferentemente WebP optimizada)
   * @param tenantId Identificador de la veterinaria/clínica
   * @param clientId ID del cliente (opcional si es nuevo)
   * @returns URL pública permanente del archivo subido
   */
  async uploadClientPhoto(
    file: File | Blob,
    tenantId: number | string,
    clientId?: number | string
  ): Promise<string> {
    await this.ensureAuthenticatedSession()

    const timestamp = Date.now()
    const safeClientId = clientId ? `cliente_${clientId}` : 'nuevo'
    const fileName = `${safeClientId}_${timestamp}.webp`
    const filePath = `${tenantId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('clientes-fotos')
      .upload(filePath, file, {
        contentType: file.type || 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      })

    if (error) {
      console.error('Error al subir fotografía de cliente:', error)
      throw new Error(`Error al subir imagen al servidor: ${error.message}`)
    }

    // Obtener la URL pública del objeto almacenado
    const { data: publicUrlData } = supabase.storage
      .from('clientes-fotos')
      .getPublicUrl(data.path)

    if (!publicUrlData?.publicUrl) {
      throw new Error('No se pudo generar la dirección URL pública de la imagen.')
    }

    return publicUrlData.publicUrl
  },

  /**
   * Extrae la ruta relativa de un archivo dentro de un bucket de Supabase Storage.
   */
  extractStoragePath(photoUrl: string, bucketName: string): string | null {
    if (!photoUrl || typeof photoUrl !== 'string') return null
    try {
      // Búsqueda por marcador de bucket /bucketName/
      const bucketMarker = `/${bucketName}/`
      const markerIndex = photoUrl.indexOf(bucketMarker)
      if (markerIndex !== -1) {
        const pathPart = photoUrl.substring(markerIndex + bucketMarker.length).split('?')[0]
        if (pathPart) return decodeURIComponent(pathPart)
      }

      // Parseo seguro mediante URL
      const url = new URL(photoUrl)
      const segments = url.pathname.split('/').filter(Boolean)
      const bucketIdx = segments.indexOf(bucketName)
      if (bucketIdx !== -1 && bucketIdx < segments.length - 1) {
        return decodeURIComponent(segments.slice(bucketIdx + 1).join('/'))
      }
    } catch (e) {
      console.warn(`Error extrayendo path de storage para URL ${photoUrl}:`, e)
    }
    return null
  },

  /**
   * Elimina un archivo del bucket 'clientes-fotos' si existe
   */
  async deleteClientPhoto(photoUrl: string): Promise<void> {
    try {
      await this.ensureAuthenticatedSession()
      
      const relativePath = this.extractStoragePath(photoUrl, 'clientes-fotos')
      if (!relativePath) return

      await supabase.storage.from('clientes-fotos').remove([relativePath])
    } catch (err) {
      console.warn('No se pudo eliminar el archivo del cliente en storage:', err)
    }
  },

  /**
   * Sube una foto de paciente/mascota al bucket 'mascotas-fotos' de Supabase Storage.
   * Organiza las fotos bajo el prefijo del tenant: {id_veterinaria}/{nombre_archivo}
   * 
   * @param file Archivo o Blob de la imagen (preferentemente WebP optimizada)
   * @param tenantId Identificador de la veterinaria/clínica
   * @param patientId ID de la mascota (opcional si es nuevo)
   * @returns URL pública permanente del archivo subido
   */
  async uploadPatientPhoto(
    file: File | Blob,
    tenantId: number | string,
    patientId?: number | string
  ): Promise<string> {
    await this.ensureAuthenticatedSession()

    const timestamp = Date.now()
    const safePatientId = patientId ? `mascota_${patientId}` : 'nueva'
    const fileName = `${safePatientId}_${timestamp}.webp`
    const filePath = `${tenantId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('mascotas-fotos')
      .upload(filePath, file, {
        contentType: file.type || 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      })

    if (error) {
      console.error('Error al subir fotografía de mascota:', error)
      throw new Error(`Error al subir imagen de mascota: ${error.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from('mascotas-fotos')
      .getPublicUrl(data.path)

    if (!publicUrlData?.publicUrl) {
      throw new Error('No se pudo generar la dirección URL pública de la mascota.')
    }

    return publicUrlData.publicUrl
  },

  /**
   * Elimina un archivo del bucket 'mascotas-fotos' si existe
   */
  async deletePatientPhoto(photoUrl: string): Promise<void> {
    try {
      await this.ensureAuthenticatedSession()

      const relativePath = this.extractStoragePath(photoUrl, 'mascotas-fotos')
      if (!relativePath) return

      await supabase.storage.from('mascotas-fotos').remove([relativePath])
    } catch (err) {
      console.warn('No se pudo eliminar la foto de la mascota en storage:', err)
    }
  },

  /**
   * Sube una foto de personal/médico al bucket 'personal-fotos' de Supabase Storage.
   * Organiza las fotos bajo el prefijo del tenant: {id_veterinaria}/staff_{id_persona}_{timestamp}.webp
   */
  async uploadStaffPhoto(
    file: File | Blob,
    tenantId: number | string,
    personaId: number | string
  ): Promise<string> {
    await this.ensureAuthenticatedSession()

    const timestamp = Date.now()
    const fileName = `staff_${personaId}_${timestamp}.webp`
    const filePath = `${tenantId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('personal-fotos')
      .upload(filePath, file, {
        contentType: file.type || 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      })

    if (error) {
      console.error('Error al subir fotografía de personal:', error)
      throw new Error(`Error al subir imagen de personal: ${error.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from('personal-fotos')
      .getPublicUrl(data.path)

    if (!publicUrlData?.publicUrl) {
      throw new Error('No se pudo generar la dirección URL pública de la foto de personal.')
    }

    return publicUrlData.publicUrl
  },

  /**
   * Elimina un archivo del bucket 'personal-fotos' si existe
   */
  async deleteStaffPhoto(photoUrl: string): Promise<void> {
    try {
      await this.ensureAuthenticatedSession()

      const relativePath = this.extractStoragePath(photoUrl, 'personal-fotos')
      if (!relativePath) return

      await supabase.storage.from('personal-fotos').remove([relativePath])
    } catch (err) {
      console.warn('No se pudo eliminar la foto del personal en storage:', err)
    }
  },

  /**
   * Elimina múltiples archivos de un bucket en lote
   */
  async deleteMultiplePhotos(bucketName: 'clientes-fotos' | 'mascotas-fotos' | 'personal-fotos', photoUrls: string[]): Promise<void> {
    if (!photoUrls || photoUrls.length === 0) return
    try {
      await this.ensureAuthenticatedSession()
      const pathsToDelete: string[] = []
      for (const url of photoUrls) {
        const path = this.extractStoragePath(url, bucketName)
        if (path && !pathsToDelete.includes(path)) {
          pathsToDelete.push(path)
        }
      }

      if (pathsToDelete.length > 0) {
        const { error } = await supabase.storage.from(bucketName).remove(pathsToDelete)
        if (error) {
          console.warn(`Error al remover archivos en lote de ${bucketName}:`, error)
        }
      }
    } catch (err) {
      console.warn(`Error en deleteMultiplePhotos (${bucketName}):`, err)
    }
  },

  /**
   * Sube un archivo clínico (foto, radiografía, documento) al bucket 'historias-clinicas'.
   * Ruta estructurada: {id_veterinaria}/{id_mascota}/{id_historia}/{timestamp}.{ext}
   */
  async uploadMedicalRecordFile(
    file: File | Blob,
    tenantId: number | string,
    patientId: number | string,
    recordId: number | string,
    extension = 'webp',
    contentType?: string
  ): Promise<string> {
    await this.ensureAuthenticatedSession()

    const timestamp = Date.now()
    const cleanExt = extension.replace(/^\./, '').toLowerCase()
    const fileName = `${timestamp}.${cleanExt}`
    const filePath = `${tenantId}/${patientId}/${recordId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('historias-clinicas')
      .upload(filePath, file, {
        contentType: contentType || (cleanExt === 'webp' ? 'image/webp' : 'application/octet-stream'),
        upsert: true,
        cacheControl: '31536000',
      })

    if (error) {
      console.error('Error al subir archivo a historias-clinicas:', error)
      throw new Error(`Error al subir archivo clínico: ${error.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from('historias-clinicas')
      .getPublicUrl(data.path)

    if (!publicUrlData?.publicUrl) {
      throw new Error('No se pudo generar la URL pública del archivo clínico.')
    }

    return publicUrlData.publicUrl
  },

  /**
   * Elimina un archivo clínico del bucket 'historias-clinicas'
   */
  async deleteMedicalRecordFile(fileUrl: string): Promise<void> {
    try {
      await this.ensureAuthenticatedSession()
      const relativePath = this.extractStoragePath(fileUrl, 'historias-clinicas')
      if (!relativePath) return

      await supabase.storage.from('historias-clinicas').remove([relativePath])
    } catch (err) {
      console.warn('No se pudo eliminar el archivo del expediente clínico en storage:', err)
    }
  },
}

