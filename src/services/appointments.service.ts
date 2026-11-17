import { supabase } from '@/config/supabase'
import { StaffService } from './staff.service'
import { assertPermission } from '@/lib/permissions'
import type {
  RealAppointmentItem,
  CreateAppointmentDTO,
  DoctorOption,
  TimeSlot,
} from '@/types/appointment.types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface AppointmentQueryOptions {
  startDate?: string
  endDate?: string
  status?: string
}

export const appointmentsService = {
  /**
   * Obtiene las citas de una veterinaria para un rango de fechas opcional,
   * resolviendo nombres de mascotas, propietarios y veterinarios.
   */
  async getAppointments(
    vetId: number,
    options?: AppointmentQueryOptions
  ): Promise<RealAppointmentItem[]> {
    let query = supabase
      .from('citas')
      .select('*')
      .eq('id_veterinaria', vetId)
      .order('fecha_inicio', { ascending: true })

    if (options?.startDate) {
      query = query.gte('fecha_inicio', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('fecha_inicio', options.endDate)
    }

    if (options?.status && options.status !== 'all') {
      query = query.ilike('estado', options.status)
    }

    const { data: rawCitas, error: citasErr } = await query

    if (citasErr) {
      console.error('Error al obtener citas:', citasErr)
      throw citasErr
    }

    const citas = rawCitas || []
    if (citas.length === 0) return []

    // Obtener IDs únicos para relaciones
    const petIds = Array.from(new Set(citas.map((c) => c.id_mascota).filter(Boolean))) as number[]
    const clientIds = Array.from(new Set(citas.map((c) => c.id_cliente).filter(Boolean))) as number[]
    const staffIds = Array.from(new Set(citas.map((c) => c.id_persona).filter(Boolean))) as number[]

    const [petsRes, clientsRes, staffRes] = await Promise.all([
      petIds.length > 0
        ? supabase.from('mascotas').select('id_mascota, nombre, especie, raza').in('id_mascota', petIds)
        : Promise.resolve({ data: [] }),
      clientIds.length > 0
        ? supabase.from('clientes').select('id_cliente, nombres, apellidos, telefono, email').in('id_cliente', clientIds)
        : Promise.resolve({ data: [] }),
      staffIds.length > 0
        ? supabase.from('personal').select('id_persona, nombres, apellidos').in('id_persona', staffIds)
        : Promise.resolve({ data: [] }),
    ])

    const petsLookup = new Map<number, { name: string; species: string; breed: string }>()
    petsRes.data?.forEach((p) => {
      petsLookup.set(p.id_mascota, {
        name: p.nombre,
        species: p.especie || 'Mascota',
        breed: p.raza || '',
      })
    })

    const clientsLookup = new Map<number, { name: string; phone?: string; email?: string }>()
    clientsRes.data?.forEach((c) => {
      clientsLookup.set(c.id_cliente, {
        name: `${c.nombres || ''} ${c.apellidos || ''}`.trim(),
        phone: c.telefono || undefined,
        email: c.email || undefined,
      })
    })

    const staffLookup = new Map<number, string>()
    staffRes.data?.forEach((s) => {
      staffLookup.set(s.id_persona, `Dr. ${s.nombres || ''} ${s.apellidos || ''}`.trim())
    })

    return citas.map((c) => {
      const pet = petsLookup.get(c.id_mascota)
      const client = clientsLookup.get(c.id_cliente)
      const vetName = staffLookup.get(c.id_persona) || 'Médico de Turno'

      return {
        id: c.id_cita,
        id_cita: c.id_cita,
        id_veterinaria: c.id_veterinaria,
        id_mascota: c.id_mascota,
        id_cliente: c.id_cliente,
        id_persona: c.id_persona,
        id_servicio: c.id_servicio,
        title: c.motivo || 'Consulta Médica',
        patient_name: pet ? `${pet.name} (${pet.species})` : `Paciente #${c.id_mascota}`,
        patient_species: pet?.species,
        patient_breed: pet?.breed,
        owner_name: client?.name || 'Propietario',
        owner_phone: client?.phone,
        owner_email: client?.email,
        veterinarian_name: vetName,
        start_time: c.fecha_inicio,
        end_time: c.fecha_fin,
        status: (c.estado || 'PENDIENTE').toUpperCase(),
        reason: c.motivo || 'Consulta General',
        notes: c.observaciones || '',
      }
    })
  },

  /**
   * Actualiza el estado de una cita y despacha notificación push al cliente si corresponde.
   * Al insertar en 'avisos_cliente', el trigger de base de datos 'trg_notify_nuevo_aviso_cliente'
   * invoca la Edge Function de Supabase para enviar la notificación push vía FCM al dispositivo móvil del cliente.
   */
  async updateAppointmentStatus(
    idCita: number,
    status: string,
    appointmentData?: Partial<RealAppointmentItem>
  ): Promise<{ success: boolean; notificationSent: boolean }> {
    const newStatus = status.toUpperCase()

    // Control de Permisos RBAC
    if (newStatus === 'CANCELADA') {
      assertPermission('CANCELAR_CITAS', 'cancelar citas médicas')
    } else {
      assertPermission('EDITAR_CITAS', 'modificar el estado de las citas médicas')
    }

    // 1. Actualizar el estado en la base de datos
    const { data: updatedCita, error } = await supabase
      .from('citas')
      .update({
        estado: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id_cita', idCita)
      .select('id_cita, id_veterinaria, id_cliente, id_mascota, fecha_inicio, motivo')
      .single()

    if (error) {
      console.error('Error al actualizar estado de cita:', error)
      throw error
    }

    let notificationSent = false

    // 2. Si la cita es CONFIRMADA o CANCELADA, crear aviso para el cliente (dispara trigger FCM push)
    if (newStatus === 'CONFIRMADA' || newStatus === 'CANCELADA') {
      try {
        const idVeterinaria = appointmentData?.id_veterinaria || updatedCita?.id_veterinaria
        const idCliente = appointmentData?.id_cliente || updatedCita?.id_cliente
        const startTime = appointmentData?.start_time || updatedCita?.fecha_inicio
        let petName = appointmentData?.patient_name

        // Si no se tiene el nombre de la mascota en el contexto, resolverlo
        if (!petName && updatedCita?.id_mascota) {
          const { data: pet } = await supabase
            .from('mascotas')
            .select('nombre')
            .eq('id_mascota', updatedCita.id_mascota)
            .single()
          if (pet?.nombre) petName = pet.nombre
        }

        if (idVeterinaria && idCliente) {
          let dateStr = ''
          let timeStr = ''
          if (startTime) {
            const dateObj = new Date(startTime)
            if (!isNaN(dateObj.getTime())) {
              dateStr = format(dateObj, "d 'de' MMMM", { locale: es })
              timeStr = format(dateObj, 'HH:mm')
            }
          }

          const petLabel = petName ? ` para ${petName}` : ''
          const timeLabel = dateStr && timeStr ? ` para el ${dateStr} a las ${timeStr}` : ''

          const titulo = newStatus === 'CONFIRMADA'
            ? '¡Cita Médica Confirmada! 📅🐾'
            : 'Cita Médica Cancelada 📅❌'

          const cuerpo = newStatus === 'CONFIRMADA'
            ? `Tu cita médica${petLabel}${timeLabel} ha sido confirmada por la veterinaria. ¡Te esperamos!`
            : `Tu cita médica${petLabel}${timeLabel} ha sido cancelada.`

          // Insertar en 'avisos_cliente' dispara el trigger trg_notify_nuevo_aviso_cliente -> Edge Function -> FCM Push
          const { error: avisoError } = await supabase
            .from('avisos_cliente')
            .insert({
              id_veterinaria: idVeterinaria,
              id_cliente: idCliente,
              titulo,
              cuerpo,
              leido: false,
              created_at: new Date().toISOString(),
            })

          if (avisoError) {
            console.warn('[appointmentsService] No se pudo registrar en avisos_cliente:', avisoError)
          } else {
            notificationSent = true
          }

          // Registrar en citas_notificaciones para trazabilidad
          try {
            await supabase.from('citas_notificaciones').insert({
              id_cita: idCita,
              tipo: newStatus === 'CONFIRMADA' ? 'CONFIRMACION' : 'CANCELACION',
              enviado: notificationSent,
              fecha_envio: new Date().toISOString(),
              mensaje: cuerpo,
              created_at: new Date().toISOString(),
            })
          } catch (notifTraceErr) {
            console.warn('[appointmentsService] Error al guardar trazabilidad citas_notificaciones:', notifTraceErr)
          }
        }
      } catch (notifyErr) {
        console.warn('[appointmentsService] Error al procesar notificación push:', notifyErr)
      }
    }

    return { success: true, notificationSent }
  },

  /**
   * Obtiene el catálogo de servicios activos para la veterinaria
   */
  async getActiveServices(idVeterinaria: number) {
    const { data, error } = await supabase
      .from('servicios')
      .select('id_servicio, id_veterinaria, nombre, descripcion, duracion_minutos, precio, color, activo')
      .eq('id_veterinaria', idVeterinaria)
      .eq('activo', true)
      .order('id_servicio', { ascending: true })

    if (error) {
      console.error('Error al obtener servicios activos:', error)
      throw error
    }
    return data || []
  },

  /**
   * Obtiene el personal médico activo de la veterinaria.
   * Utiliza StaffService (RPC get_personal_veterinaria con fallback resiliente)
   * y contempla estados 'VIG' (Vigente en base de datos) y 'ACTIVO'.
   */
  async getMedicalStaff(idVeterinaria: number): Promise<DoctorOption[]> {
    if (!idVeterinaria || idVeterinaria <= 0) return []

    try {
      // 1. Obtener nómina completa de la clínica mediante StaffService
      const staffList = await StaffService.getStaffByClinic(idVeterinaria)

      // 2. Filtrar personal con rol médico o asistencial activo
      const medicalStaff = staffList.filter((member) => {
        const rol = (member.rol || '').toUpperCase().trim()
        const rolInfo = (member.rol_info?.nombre || '').toUpperCase().trim()

        const isMedRole = ['MED', 'PRO', 'VETERINARIO', 'VET', 'DOCTOR', 'MEDICO', 'CIRUJANO'].includes(rol)
        const isMedCustomRole =
          rolInfo.includes('VET') ||
          rolInfo.includes('MEDIC') ||
          rolInfo.includes('DOCTOR') ||
          rolInfo.includes('CIRUJ')

        // En SAS VETBOL el estado de personal vigente es 'VIG', admitiendo también 'ACTIVO'
        const isActivo = member.estado === 'VIG' || member.estado === 'ACTIVO' || !member.estado

        return (isMedRole || isMedCustomRole) && isActivo
      })

      // Si hay médicos identificados retornarlos, caso contrario listar miembros activos para no bloquear la agenda
      const doctorsToReturn =
        medicalStaff.length > 0
          ? medicalStaff
          : staffList.filter((m) => m.estado === 'VIG' || m.estado === 'ACTIVO')

      return doctorsToReturn.map((doc) => ({
        id_persona: doc.id_persona,
        nombres: doc.nombres,
        apellidos: doc.apellidos,
        rol: doc.rol,
        foto_url: doc.foto_url,
      }))
    } catch (serviceErr) {
      console.warn('Fallo al obtener personal mediante StaffService, ejecutando fallback directo:', serviceErr)

      // Fallback directo a tabla personal con soporte para 'VIG' y 'ACTIVO'
      const { data, error } = await supabase
        .from('personal')
        .select('id_persona, nombres, apellidos, rol, foto_url')
        .eq('id_veterinaria', idVeterinaria)
        .in('estado', ['VIG', 'ACTIVO'])
        .in('rol', ['MED', 'PRO', 'VETERINARIO', 'ADM'])

      if (error) {
        console.error('Error al obtener personal médico en fallback:', error)
        throw error
      }
      return (data as DoctorOption[]) || []
    }
  },

  /**
   * Calcula los turnos disponibles para un médico específico en una fecha determinada.
   * Reglas:
   * - Día de la semana ISO (1..7).
   * - Respeta turnos de horarios_personal (con fallback a horario clínico estándar si aún no tiene configurados).
   * - Excluye colisiones con citas (estado != 'CANCELADA') y bloqueos_agenda.
   * - Si la fecha es hoy, solo permite horarios estrictamente futuros.
   * - Intervalos de 30 minutos respetando duracion_minutos.
   */
  async getDoctorAvailableSlots(params: {
    idVeterinaria: number
    idPersona: number
    fecha: Date
    duracionMinutos: number
    doctorName?: string
  }): Promise<TimeSlot[]> {
    const { idVeterinaria, idPersona, fecha, duracionMinutos, doctorName } = params

    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    const datePrefix = `${year}-${month}-${day}`

    const startOfDay = new Date(`${datePrefix}T00:00:00`)
    const endOfDay = new Date(`${datePrefix}T23:59:59.999`)

    // Día de la semana ISO (1 = Lunes, 7 = Domingo)
    const dayOfWeek = fecha.getDay() === 0 ? 7 : fecha.getDay()

    const [schedulesRes, appointmentsRes, blockagesRes] = await Promise.all([
      supabase
        .from('horarios_personal')
        .select('hora_inicio, hora_fin')
        .eq('id_persona', idPersona)
        .eq('dia_semana', dayOfWeek)
        .eq('activo', true),
      supabase
        .from('citas')
        .select('fecha_inicio, fecha_fin')
        .eq('id_veterinaria', idVeterinaria)
        .eq('id_persona', idPersona)
        .gte('fecha_inicio', startOfDay.toISOString())
        .lte('fecha_inicio', endOfDay.toISOString())
        .neq('estado', 'CANCELADA'),
      supabase
        .from('bloqueos_agenda')
        .select('fecha_inicio, fecha_fin')
        .or(`id_persona.eq.${idPersona},id_persona.is.null`)
        .gte('fecha_fin', startOfDay.toISOString())
        .lte('fecha_inicio', endOfDay.toISOString()),
    ])

    let shifts = schedulesRes.data || []

    // Si no hay turnos registrados para hoy, verificar si el médico no tiene ningún turno configurado en la semana
    if (shifts.length === 0) {
      const { data: anyShift } = await supabase
        .from('horarios_personal')
        .select('id_horario')
        .eq('id_persona', idPersona)
        .limit(1)

      // Si el médico aún no tiene ningún horario configurado en el sistema, aplicamos horario estándar por defecto
      if (!anyShift || anyShift.length === 0) {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          // Lunes a Viernes: 08:30 a 18:30
          shifts = [{ hora_inicio: '08:30:00', hora_fin: '18:30:00' }]
        } else if (dayOfWeek === 6) {
          // Sábado: 09:00 a 14:00
          shifts = [{ hora_inicio: '09:00:00', hora_fin: '14:00:00' }]
        }
      }
    }

    if (shifts.length === 0) return []

    const appointments = (appointmentsRes.data || []).map((a) => ({
      start: new Date(a.fecha_inicio).getTime(),
      end: new Date(a.fecha_fin).getTime(),
    }))

    const blockages = (blockagesRes.data || []).map((b) => ({
      start: new Date(b.fecha_inicio).getTime(),
      end: new Date(b.fecha_fin).getTime(),
    }))

    const availableSlots: TimeSlot[] = []
    const now = Date.now()
    const serviceDurationMs = (duracionMinutos > 0 ? duracionMinutos : 15) * 60 * 1000
    const stepMs = 30 * 60 * 1000 // Intervalos de 30 minutos

    for (const shift of shifts) {
      if (!shift.hora_inicio || !shift.hora_fin) continue
      const [startH, startM] = shift.hora_inicio.split(':').map(Number)
      const [endH, endM] = shift.hora_fin.split(':').map(Number)

      let current = new Date(fecha)
      current.setHours(startH, startM, 0, 0)

      const shiftEnd = new Date(fecha)
      shiftEnd.setHours(endH, endM, 0, 0)

      while (current.getTime() + serviceDurationMs <= shiftEnd.getTime()) {
        const slotStart = current.getTime()
        const slotEnd = slotStart + serviceDurationMs

        const isBlocked = blockages.some((b) => slotStart < b.end && slotEnd > b.start)
        const isBooked = appointments.some((c) => slotStart < c.end && slotEnd > c.start)
        const isPast = slotStart <= now

        if (!isBlocked && !isBooked && !isPast) {
          const slotDate = new Date(current)
          availableSlots.push({
            slot: slotDate,
            label: format(slotDate, 'hh:mm a'),
            idPersona,
            doctorName,
          })
        }

        current = new Date(current.getTime() + stepMs)
      }
    }

    return availableSlots
  },

  /**
   * Obtiene la disponibilidad consolidada de todos los médicos (Primer Médico Disponible).
   * Asocia cada horario libre al primer médico que esté disponible en ese slot.
   */
  async getAllDoctorsAvailableSlots(params: {
    idVeterinaria: number
    doctors: DoctorOption[]
    fecha: Date
    duracionMinutos: number
  }): Promise<TimeSlot[]> {
    const { idVeterinaria, doctors, fecha, duracionMinutos } = params
    if (!doctors || doctors.length === 0) return []

    const doctorSlotPromises = doctors.map((doc) =>
      this.getDoctorAvailableSlots({
        idVeterinaria,
        idPersona: doc.id_persona,
        fecha,
        duracionMinutos,
        doctorName: `${doc.nombres} ${doc.apellidos}`.trim(),
      })
    )

    const allDoctorSlots = await Promise.all(doctorSlotPromises)

    // Diccionario para indexar al primer médico libre por horario
    const slotMap = new Map<number, TimeSlot>()
    for (const slots of allDoctorSlots) {
      for (const s of slots) {
        const key = s.slot.getTime()
        if (!slotMap.has(key)) {
          slotMap.set(key, s)
        }
      }
    }

    return Array.from(slotMap.values()).sort((a, b) => a.slot.getTime() - b.slot.getTime())
  },

  /**
   * Inserta una nueva cita médica en 'citas'.
   * Calcula fecha_fin = fecha_inicio + duracionMinutos.
   * Captura el trigger de solapamiento de Postgres.
   */
  async createAppointment(dto: CreateAppointmentDTO) {
    assertPermission('CREAR_CITAS', 'agendar nuevas citas médicas')

    const duration = dto.duracionMinutos > 0 ? dto.duracionMinutos : 15
    const fechaFin = new Date(dto.fechaInicio.getTime() + duration * 60 * 1000)

    const { data, error } = await supabase
      .from('citas')
      .insert({
        id_veterinaria: dto.idVeterinaria,
        id_cliente: dto.idCliente,
        id_mascota: dto.idMascota,
        id_persona: dto.idPersona,
        id_servicio: dto.idServicio,
        fecha_inicio: dto.fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        estado: 'PENDIENTE',
        origen: dto.origen || 'WEB',
        motivo: dto.motivo || '',
        observaciones: dto.observaciones || '',
        confirmado_cliente: false,
        recordatorio_enviado: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al registrar cita médica:', error)
      if (
        error.message?.toLowerCase().includes('validar_solapamiento') ||
        error.message?.toLowerCase().includes('ya tiene una cita')
      ) {
        throw new Error('El veterinario ya tiene una cita agendada en ese horario.')
      }
      throw new Error(error.message || 'No se pudo agendar la cita médica.')
    }

    return data
  },
}
