import { supabase } from '@/config/supabase'
import { storageService } from '@/services/storage.service'
import { assertPermission } from '@/lib/permissions'
import type { Clientes, AvisosCliente } from '@/types/database.types'

export interface SendClientNoticeInput {
  id_veterinaria: number
  id_cliente: number
  titulo: string
  cuerpo?: string | null
}

export interface ClientFilters {
  searchTerm?: string
  depto?: number
}

export interface CreateClientInput {
  id_veterinaria: number
  nombres: string
  apellidos: string
  numero_ci?: string | null
  telefono: string
  email?: string | null
  foto_url?: string | null
  password?: string | null
  fcm_token?: string | null
  depto?: number | null
}

export interface UpdateClientInput {
  nombres?: string
  apellidos?: string
  numero_ci?: string | null
  telefono?: string
  email?: string | null
  foto_url?: string | null
  password?: string | null
  fcm_token?: string | null
  depto?: number | null
}

export const clientsService = {
  /**
   * Obtiene los clientes de la veterinaria activa
   */
  async getClients(idVeterinaria: number, filters?: ClientFilters): Promise<Clientes[]> {
    let query = supabase
      .from('clientes')
      .select('*')
      .eq('id_veterinaria', idVeterinaria)
      .order('fecha_crea', { ascending: false })

    if (filters?.searchTerm) {
      const term = filters.searchTerm.trim()
      query = query.or(`nombres.ilike.%${term}%,apellidos.ilike.%${term}%,numero_ci.ilike.%${term}%,telefono.ilike.%${term}%`)
    }

    if (filters?.depto) {
      query = query.eq('depto', filters.depto)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener clientes:', error)
      throw error
    }

    return data || []
  },

  /**
   * Registra un nuevo cliente/propietario
   */
  async createClient(client: CreateClientInput): Promise<Clientes> {
    assertPermission('CREAR_CLIENTES', 'registrar nuevos propietarios')

    const formattedClient = {
      ...client,
      nombres: client.nombres.trim().toUpperCase(),
      apellidos: client.apellidos.trim().toUpperCase(),
      email: client.email ? client.email.trim().toLowerCase() : null,
      fecha_crea: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert(formattedClient)
      .select()
      .single()

    if (error) {
      console.error('Error al crear cliente:', error)
      if (error.code === '23505' || error.message?.includes('clientes_email_id_veterinaria_key')) {
        throw new Error('El correo electrónico ya se encuentra registrado para otro cliente en esta veterinaria.')
      }
      throw new Error(error.message || 'Error al registrar cliente.')
    }

    return data
  },

  /**
   * Actualiza un cliente existente
   */
  async updateClient(idCliente: number, updates: UpdateClientInput): Promise<Clientes> {
    assertPermission('EDITAR_CLIENTES', 'modificar información de clientes')

    const formattedUpdates = {
      ...updates,
      ...(updates.nombres ? { nombres: updates.nombres.trim().toUpperCase() } : {}),
      ...(updates.apellidos ? { apellidos: updates.apellidos.trim().toUpperCase() } : {}),
      ...(updates.email !== undefined ? { email: updates.email ? updates.email.trim().toLowerCase() : null } : {}),
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(formattedUpdates)
      .eq('id_cliente', idCliente)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar cliente:', error)
      if (error.code === '23505' || error.message?.includes('clientes_email_id_veterinaria_key')) {
        throw new Error('El correo electrónico ya se encuentra registrado para otro cliente en esta veterinaria.')
      }
      throw new Error(error.message || 'Error al actualizar información del cliente.')
    }

    return data
  },

  /**
   * Obtiene la información de un cliente específico por su ID
   */
  async getClientById(idCliente: number): Promise<Clientes | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id_cliente', idCliente)
      .maybeSingle()

    if (error) {
      console.error('Error al obtener cliente por ID:', error)
      throw error
    }

    return data || null
  },

  /**
   * Elimina un cliente y todos sus datos asociados de forma limpia:
   * 1. Obtiene datos del cliente para saber su foto_url (si tiene).
   * 2. Consulta URLs de fotos de todas las mascotas asociadas a este cliente:
   *    SELECT foto_url FROM mascotas WHERE id_cliente = idCliente
   * 3. Limpieza Storage Bucket 'clientes-fotos':
   *    Extrae el path relativo y ejecuta storage.from('clientes-fotos').remove([path])
   * 4. Limpieza Storage Bucket 'mascotas-fotos':
   *    Itera y elimina las fotos de todas las mascotas del storage.
   * 5. Eliminación en Base de Datos:
   *    DELETE FROM clientes WHERE id_cliente = idCliente
   *    (PostgreSQL ON DELETE CASCADE elimina automáticamente mascotas, historias clínicas,
   *     signos vitales, diagnósticos, tratamientos, historial de vacunas, citas y avisos).
   */
  async deleteClient(idCliente: number): Promise<void> {
    assertPermission('ELIMINAR_CLIENTES', 'eliminar propietarios y sus datos asociados')

    // 1. Obtener datos del cliente para conocer su foto_url
    const cliente = await this.getClientById(idCliente)
    if (!cliente) return

    // 2. Obtener fotos de las mascotas asociadas a este cliente ANTES de que PostgreSQL las elimine en cascada
    let fotosMascotasUrls: string[] = []
    try {
      const { data: mascotasData, error: petError } = await supabase
        .from('mascotas')
        .select('foto_url')
        .eq('id_cliente', idCliente)

      if (!petError && mascotasData) {
        fotosMascotasUrls = mascotasData
          .map((m: any) => m.foto_url as string | null)
          .filter((url): url is string => !!url && typeof url === 'string' && url.trim().length > 0)
      }
    } catch (e) {
      console.error('Error consultando URLs de fotos de mascotas para eliminación:', e)
    }

    // 3. Eliminar la foto del cliente de Supabase Storage ('clientes-fotos')
    if (cliente.foto_url && cliente.foto_url.trim()) {
      try {
        await storageService.deleteClientPhoto(cliente.foto_url)
      } catch (e) {
        console.error('Error eliminando foto del cliente de storage:', e)
      }
    }

    // 4. Eliminar las fotos de las mascotas del cliente de Supabase Storage ('mascotas-fotos')
    if (fotosMascotasUrls.length > 0) {
      try {
        await storageService.deleteMultiplePhotos('mascotas-fotos', fotosMascotasUrls)
      } catch (e) {
        console.error('Error eliminando fotos de mascotas del cliente de storage:', e)
      }
    }

    // 5. Eliminar el registro del cliente de la base de datos
    // PostgreSQL ejecuta ON DELETE CASCADE borrando mascotas, citas, historias, vacunas, etc.
    const { error: deleteError } = await supabase
      .from('clientes')
      .delete()
      .eq('id_cliente', idCliente)

    if (deleteError) {
      console.error('Error al eliminar cliente de la base de datos:', deleteError)
      throw deleteError
    }
  },

  /**
   * Envía un aviso/notificación push al cliente registrándolo en 'avisos_cliente'.
   * La inserción dispara el trigger AFTER INSERT 'trg_notify_nuevo_aviso_cliente'
   * que ejecuta la Edge Function push-aviso-cliente para Firebase FCM v1.
   */
  async sendClientNotice(input: SendClientNoticeInput): Promise<AvisosCliente> {
    const { data, error } = await supabase
      .schema('veterinarias')
      .from('avisos_cliente')
      .insert({
        id_veterinaria: input.id_veterinaria,
        id_cliente: input.id_cliente,
        titulo: input.titulo.trim(),
        cuerpo: input.cuerpo?.trim() || null,
        leido: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al enviar aviso a cliente:', error)
      throw error
    }

    return data
  },
}
