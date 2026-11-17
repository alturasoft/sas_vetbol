import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay } from 'date-fns'
import { AlertCircle } from 'lucide-react'
import type { CalendarViewMode, RealAppointmentItem } from '@/types/appointment.types'
import { appointmentsService } from '@/services/appointments.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { usePermissions } from '@/hooks/usePermissions'

import { AppointmentsHeader } from './components/AppointmentsHeader'
import { AppointmentsViewSelector } from './components/AppointmentsViewSelector'
import { AppointmentDayView } from './components/AppointmentDayView'
import { AppointmentWeekView } from './components/AppointmentWeekView'
import { AppointmentMonthView } from './components/AppointmentMonthView'
import { AppointmentDetailModal } from './components/AppointmentDetailModal'
import { NewAppointmentModal } from './components/NewAppointmentModal'
import { toast } from '@/stores/useToastStore'

export function AppointmentsCalendarPage() {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const { hasPermission } = usePermissions()
  const activeVetId =
    currentTenant?.id_veterinaria ??
    user?.id_veterinaria ??
    (currentTenant?.id ? Number(currentTenant.id) : null)

  // Estados de vista y navegación temporal
  const [currentView, setCurrentView] = useState<CalendarViewMode>('day')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Datos y estado de carga
  const [appointments, setAppointments] = useState<RealAppointmentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal de detalle
  const [selectedAppointment, setSelectedAppointment] = useState<RealAppointmentItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Modal de nueva cita
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)

  const handleOpenNewAppointment = () => {
    if (!hasPermission('CREAR_CITAS')) {
      toast.error('No tienes permisos para agendar citas médicas.')
      return
    }
    setIsNewAppointmentOpen(true)
  }

  // Carga de citas desde el servicio
  const loadAppointments = useCallback(async () => {
    if (!activeVetId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await appointmentsService.getAppointments(activeVetId)
      setAppointments(data)
    } catch (err: any) {
      console.error('Error al cargar citas:', err)
      setError(err?.message || 'Error al obtener las citas de la veterinaria.')
    } finally {
      setIsLoading(false)
    }
  }, [activeVetId])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Navegación temporal según la vista activa
  const handlePrevDate = () => {
    if (currentView === 'day') setCurrentDate((prev) => subDays(prev, 1))
    else if (currentView === 'week') setCurrentDate((prev) => subWeeks(prev, 1))
    else setCurrentDate((prev) => subMonths(prev, 1))
  }

  const handleNextDate = () => {
    if (currentView === 'day') setCurrentDate((prev) => addDays(prev, 1))
    else if (currentView === 'week') setCurrentDate((prev) => addWeeks(prev, 1))
    else setCurrentDate((prev) => addMonths(prev, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Al hacer clic en un día desde vista mensual o semanal, saltar a vista día
  const handleSelectDay = (day: Date) => {
    setCurrentDate(day)
    setCurrentView('day')
  }

  // Filtrado de citas según estado seleccionado
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter === 'all') return true
      const st = (apt.status || '').toLowerCase()
      if (statusFilter === 'completed') return st === 'completada' || st === 'completed'
      if (statusFilter === 'in_progress') return st === 'en_proceso' || st === 'in_progress'
      if (statusFilter === 'confirmed') return st === 'confirmada' || st === 'confirmed'
      if (statusFilter === 'scheduled') return st === 'pendiente' || st === 'scheduled' || st === 'programada'
      return st === statusFilter.toLowerCase()
    })
  }, [appointments, statusFilter])

  // Citas del día actual seleccionado para la vista Día
  const dayAppointments = useMemo(() => {
    return filteredAppointments.filter((apt) => isSameDay(new Date(apt.start_time), currentDate))
  }, [filteredAppointments, currentDate])

  // Selección de cita para ver detalle
  const handleSelectAppointment = (apt: RealAppointmentItem) => {
    setSelectedAppointment(apt)
    setIsDetailOpen(true)
  }

  // Actualización de estado de la cita desde el modal
  const handleStatusChange = async (idCita: number, newStatus: string) => {
    try {
      const apt = appointments.find((a) => a.id === idCita)
      const res = await appointmentsService.updateAppointmentStatus(idCita, newStatus, apt)

      // Actualizar estado local inmediatamente
      setAppointments((prev) =>
        prev.map((a) => (a.id === idCita ? { ...a, status: newStatus.toUpperCase() } : a))
      )

      if (newStatus.toUpperCase() === 'CONFIRMADA') {
        if (res.notificationSent) {
          toast.success(
            `Cita confirmada correctamente. Se despachó la notificación push al cliente (${apt?.owner_name || 'Propietario'}).`,
            'Cita Confirmada y Notificada'
          )
        } else {
          toast.success('Cita médica confirmada con éxito.', 'Cita Confirmada')
        }
      } else if (newStatus.toUpperCase() === 'CANCELADA') {
        toast.info('La cita fue cancelada y se notificó al propietario.', 'Cita Cancelada')
      } else {
        toast.success(`Estado de la cita actualizado a ${newStatus}.`)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el estado de la cita.')
      toast.error(err?.message || 'No se pudo actualizar el estado de la cita.')
      throw err
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <AppointmentsHeader
        clinicName={currentTenant?.name}
        isLoading={isLoading}
        onRefresh={loadAppointments}
        onNewAppointment={hasPermission('CREAR_CITAS') ? handleOpenNewAppointment : undefined}
      />

      {/* Selector de Vistas (Día, Semana, Mes), Navegador Temporal y Filtros */}
      <AppointmentsViewSelector
        currentView={currentView}
        onViewChange={setCurrentView}
        currentDate={currentDate}
        onPrevDate={handlePrevDate}
        onNextDate={handleNextDate}
        onToday={handleToday}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Alerta de Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Renderizado condicional de las 3 Vistas */}
      {currentView === 'day' && (
        <AppointmentDayView
          appointments={dayAppointments}
          selectedDate={currentDate}
          isLoading={isLoading}
          onSelectAppointment={handleSelectAppointment}
          onNewAppointment={hasPermission('CREAR_CITAS') ? handleOpenNewAppointment : undefined}
        />
      )}

      {currentView === 'week' && (
        <AppointmentWeekView
          appointments={filteredAppointments}
          selectedDate={currentDate}
          isLoading={isLoading}
          onSelectAppointment={handleSelectAppointment}
          onSelectDay={handleSelectDay}
        />
      )}

      {currentView === 'month' && (
        <AppointmentMonthView
          appointments={filteredAppointments}
          selectedDate={currentDate}
          isLoading={isLoading}
          onSelectAppointment={handleSelectAppointment}
          onSelectDay={handleSelectDay}
        />
      )}

      {/* Modal de Detalle y Gestión de Cita */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedAppointment(null)
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Modal Wizard para Registrar Nueva Cita */}
      {activeVetId && hasPermission('CREAR_CITAS') && (
        <NewAppointmentModal
          isOpen={isNewAppointmentOpen}
          onClose={() => setIsNewAppointmentOpen(false)}
          vetId={activeVetId}
          onSuccess={loadAppointments}
        />
      )}
    </div>
  )
}
