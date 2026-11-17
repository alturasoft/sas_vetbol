import { supabase, supabasePublic } from '@/config/supabase'
import { storageService } from './storage.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { mapRowToRol } from './roles.service'
import { assertPermission } from '@/lib/permissions'
import type {
  PersonaStaff,
  RegisterStaffDTO,
  UpdateStaffDTO,
  HorarioPersonal,
  BloqueoAgenda,
  RolRBAC,
} from '@/types/staff.types'

export class StaffService {
  private static readonly BUCKET_NAME = 'personal-fotos'

  /**
   * 1. Listar staff activo de una veterinaria con sus roles asociados
   */
  static async getStaffByClinic(idVeterinaria: number): Promise<PersonaStaff[]> {
    if (!idVeterinaria || idVeterinaria <= 0) {
      return []
    }

    let staffList: PersonaStaff[] = []

    // 1.1 Intentar primero invocar la RPC get_personal_veterinaria
    try {
      const { data: rpcData, error: rpcErr } = await (supabase as any).rpc('get_personal_veterinaria', {
        p_id_veterinaria: idVeterinaria,
      })

      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
        staffList = rpcData as unknown as PersonaStaff[]
      } else {
        // Intentar en el cliente public
        const { data: pubData, error: pubErr } = await (supabasePublic as any).rpc('get_personal_veterinaria', {
          p_id_veterinaria: idVeterinaria,
        })
        if (!pubErr && Array.isArray(pubData) && pubData.length > 0) {
          staffList = pubData as unknown as PersonaStaff[]
        }
      }
    } catch (rpcCatch) {
      console.warn('Aviso: RPC get_personal_veterinaria no disponible, usando fallback a tabla personal:', rpcCatch)
    }

    // 1.2 Fallback resiliente: consultar directamente la tabla veterinarias.personal
    if (staffList.length === 0) {
      const { data: directData, error: directErr } = await supabase
        .from('personal')
        .select('*')
        .eq('id_veterinaria', idVeterinaria)
        .eq('estado', 'VIG')

      if (directErr) {
        console.error('Error al consultar tabla personal directamente:', directErr)
        throw directErr
      }

      const priorityMap: Record<string, number> = { PRO: 1, MED: 2, ADM: 3 }
      staffList = ((directData || []) as unknown as PersonaStaff[]).sort((a, b) => {
        const pA = priorityMap[a.rol] || 4
        const pB = priorityMap[b.rol] || 4
        if (pA !== pB) return pA - pB
        return (a.nombres || '').localeCompare(b.nombres || '')
      })
    }

    // 1.3 Enriquecer con información del rol RBAC granular si existe
    try {
      const personaIds = staffList.map((p) => p.id_persona)
      if (personaIds.length > 0) {
        const { data: userRoles } = await supabase
          .from('usuarios_roles')
          .select('id_persona, id_rol, roles (id_rol, nombre)')
          .in('id_persona', personaIds)

        if (userRoles && userRoles.length > 0) {
          const roleMap = new Map<number, { id_rol: number; nombre: string }>()
          userRoles.forEach((ur: any) => {
            if (ur.roles) {
              roleMap.set(ur.id_persona, {
                id_rol: ur.roles.id_rol,
                nombre: ur.roles.nombre,
              })
            }
          })

          return staffList.map((p) => ({
            ...p,
            rol_info: roleMap.get(p.id_persona),
          }))
        }
      }
    } catch (roleErr) {
      console.warn('No se pudieron obtener roles granulares:', roleErr)
    }

    return staffList
  }

  /**
   * 2. Alta de nuevo personal con cuenta Auth auto-confirmada
   */
  static async registerStaff(dto: RegisterStaffDTO): Promise<PersonaStaff> {
    assertPermission('ADMINISTRAR_USUARIOS', 'dar de alta nuevo personal')

    const { data, error } = await (supabase as any).rpc('registrar_personal_con_auth', {
      p_nombres: dto.nombres.trim(),
      p_apellidos: dto.apellidos.trim(),
      p_email: dto.email.trim().toLowerCase(),
      p_password: dto.password,
      p_telefono: dto.telefono ? dto.telefono.trim() : null,
      p_rol: dto.rol,
      p_id_rol: dto.id_rol ?? null,
    })

    if (error) {
      console.error('Error en registrar_personal_con_auth:', error)
      throw new Error(error.message || 'Error al registrar personal con credenciales de acceso.')
    }

    return data as unknown as PersonaStaff
  }

  /**
   * 3. Edición de datos e imagen de personal
   */
  static async updateStaff(dto: UpdateStaffDTO): Promise<PersonaStaff> {
    assertPermission('ADMINISTRAR_USUARIOS', 'modificar información del personal')

    let fotoUrl: string | undefined

    // 3.1 Subida y reemplazo de imagen si se adjuntó un archivo nuevo
    if (dto.foto_file) {
      // Consultar foto previa para eliminarla del storage
      const { data: currentData } = await supabase
        .from('personal')
        .select('foto_url')
        .eq('id_persona', dto.id_persona)
        .maybeSingle()

      const oldUrl = currentData?.foto_url
      if (oldUrl) {
        await storageService.deleteStaffPhoto(oldUrl)
      }

      // Subir nueva foto optimizada
      fotoUrl = await storageService.uploadStaffPhoto(
        dto.foto_file,
        dto.id_veterinaria,
        dto.id_persona
      )
    }

    // 3.2 Actualizar registro en tabla personal
    const updatePayload: Record<string, unknown> = {
      nombres: dto.nombres.trim(),
      apellidos: dto.apellidos.trim(),
      email: dto.email.trim().toLowerCase(),
      telefono: dto.telefono ? dto.telefono.trim() : null,
      rol: dto.rol,
    }

    if (fotoUrl) {
      updatePayload.foto_url = fotoUrl
    }

    const { data: personaUpdated, error: updateError } = await supabase
      .from('personal')
      .update(updatePayload)
      .eq('id_persona', dto.id_persona)
      .eq('id_veterinaria', dto.id_veterinaria)
      .select()
      .single()

    if (updateError) {
      console.error('Error al actualizar registro de personal:', updateError)
      throw updateError
    }

    // 3.3 Actualizar o asignar rol RBAC granular si se seleccionó
    if (dto.id_rol) {
      const { error: roleErr } = await supabase
        .from('usuarios_roles')
        .upsert({
          id_persona: dto.id_persona,
          id_rol: dto.id_rol,
        })

      if (roleErr) {
        console.warn('Aviso al actualizar rol granular:', roleErr)
      }
    }

    // 3.4 Refrescar permisos en caliente si el usuario modificado está en sesión
    await useAuthStore.getState().refreshPermissions()

    return personaUpdated as PersonaStaff
  }

  /**
   * 4. Baja de personal y revocación de cuenta Auth
   */
  static async darDeBajaStaff(idPersona: number): Promise<void> {
    assertPermission('ADMINISTRAR_USUARIOS', 'dar de baja personal')

    const { error } = await (supabase as any).rpc('dar_de_baja_personal', {
      p_id_persona: idPersona,
    })

    if (error) {
      console.error('Error en dar_de_baja_personal:', error)
      throw new Error(error.message || 'Error al procesar la baja del personal.')
    }
  }

  /**
   * 5. Obtener horarios configurados de un médico
   */
  static async getHorariosByPersona(idPersona: number): Promise<HorarioPersonal[]> {
    const { data, error } = await supabase
      .from('horarios_personal')
      .select('*')
      .eq('id_persona', idPersona)
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true })

    if (error) {
      console.error('Error al obtener horarios del médico:', error)
      throw error
    }

    return (data || []) as HorarioPersonal[]
  }

  /**
   * 6. Guardar horarios semanales del médico (Lunes a Domingo)
   */
  static async saveHorarios(idPersona: number, horarios: HorarioPersonal[]): Promise<void> {
    assertPermission('ADMINISTRAR_USUARIOS', 'configurar turnos y horarios del personal')

    for (const h of horarios) {
      if (h.activo) {
        // Normalizar horas al formato HH:mm:ss si vienen como HH:mm
        const horaInicio = h.hora_inicio.length === 5 ? `${h.hora_inicio}:00` : h.hora_inicio
        const horaFin = h.hora_fin.length === 5 ? `${h.hora_fin}:00` : h.hora_fin

        if (h.id_horario) {
          const { error } = await supabase
            .from('horarios_personal')
            .update({
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              activo: true,
            })
            .eq('id_horario', h.id_horario)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('horarios_personal')
            .insert({
              id_persona: idPersona,
              dia_semana: h.dia_semana,
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              activo: true,
            })

          if (error) throw error
        }
      } else if (h.id_horario) {
        // Si fue desactivado y ya tenía registro, eliminarlo para mantener la tabla limpia
        const { error } = await supabase
          .from('horarios_personal')
          .delete()
          .eq('id_horario', h.id_horario)

        if (error) throw error
      }
    }
  }

  /**
   * 7. Obtener roles RBAC disponibles para la veterinaria
   */
  static async getRolesByClinic(idVeterinaria: number): Promise<RolRBAC[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('id_rol, id_veterinaria, nombre, descripcion, activo, es_sistema, roles_permisos(count), usuarios_roles(count)')
      .eq('id_veterinaria', idVeterinaria)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) {
      console.warn('Error al consultar roles de la clínica:', error)
      return []
    }

    return (data || []).map(mapRowToRol)
  }

  /**
   * 8. Obtener bloqueos de agenda (vacaciones, descansos, etc.)
   */
  static async getBloqueos(idVeterinaria: number, idPersona?: number | null): Promise<BloqueoAgenda[]> {
    let query = supabase
      .from('bloqueos_agenda')
      .select('*')
      .eq('id_veterinaria', idVeterinaria)
      .order('fecha_inicio', { ascending: true })

    if (idPersona) {
      query = query.eq('id_persona', idPersona)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener bloqueos de agenda:', error)
      throw error
    }

    return (data || []) as BloqueoAgenda[]
  }

  /**
   * 9. Crear bloqueo de agenda
   */
  static async createBloqueo(bloqueo: {
    id_veterinaria: number
    id_persona?: number | null
    fecha_inicio: string
    fecha_fin: string
    tipo_bloqueo: string
    motivo?: string
  }): Promise<BloqueoAgenda> {
    const { data, error } = await supabase
      .from('bloqueos_agenda')
      .insert({
        id_veterinaria: bloqueo.id_veterinaria,
        id_persona: bloqueo.id_persona ?? null,
        fecha_inicio: bloqueo.fecha_inicio,
        fecha_fin: bloqueo.fecha_fin,
        tipo_bloqueo: bloqueo.tipo_bloqueo,
        motivo: bloqueo.motivo ? bloqueo.motivo.trim() : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear bloqueo de agenda:', error)
      throw error
    }

    return data as BloqueoAgenda
  }

  /**
   * 10. Eliminar bloqueo de agenda
   */
  static async deleteBloqueo(idBloqueo: number): Promise<void> {
    const { error } = await supabase
      .from('bloqueos_agenda')
      .delete()
      .eq('id_bloqueo', idBloqueo)

    if (error) {
      console.error('Error al eliminar bloqueo de agenda:', error)
      throw error
    }
  }
}
