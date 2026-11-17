import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Dog,
  Users,
  Clock,
  PlusCircle,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Building2,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { supabase } from '@/config/supabase'

interface TodayAppointmentItem {
  id: number
  time: string
  patientName: string
  speciesBreed: string
  ownerName: string
  reason: string
  status: string
}

interface RecentPatientItem {
  id: number
  name: string
  species: string
  ownerName: string
  lastVisit: string
  avatarUrl: string | null
}

interface DashboardMetrics {
  todayAppointmentsCount: number
  pendingAppointmentsCount: number
  completedAppointmentsCount: number
  totalPatientsCount: number
  totalClientsCount: number
  totalStaffCount: number
  totalConsultationsCount: number
  todayAppointments: TodayAppointmentItem[]
  recentPatients: RecentPatientItem[]
}

function formatAppointmentTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return dateStr
  }
}

function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return 'Reciente'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const now = new Date()
    const diffTime = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Hoy, ${d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: true })}`
    }
    if (diffDays === 1) {
      return `Ayer, ${d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: true })}`
    }
    return d.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
  } catch {
    return 'Reciente'
  }
}

function renderStatusBadge(status: string) {
  const norm = status?.toUpperCase() || ''
  if (norm === 'COMPLETADA' || norm === 'COMPLETED' || norm === 'ATENDIDA') {
    return <Badge variant="secondary">Completada</Badge>
  }
  if (norm === 'EN_PROCESO' || norm === 'IN_PROGRESS' || norm === 'EN CONSULTA') {
    return <Badge variant="warning">En Consulta</Badge>
  }
  if (norm === 'CONFIRMADA' || norm === 'CONFIRMED') {
    return <Badge variant="success">Confirmada</Badge>
  }
  if (norm === 'CANCELADA' || norm === 'CANCELLED') {
    return <Badge variant="destructive">Cancelada</Badge>
  }
  return <Badge variant="outline">{status || 'Programada'}</Badge>
}

export function DashboardOverviewPage() {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const activeVetId =
    currentTenant?.id_veterinaria ??
    user?.id_veterinaria ??
    (currentTenant?.id ? Number(currentTenant.id) : null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayAppointmentsCount: 0,
    pendingAppointmentsCount: 0,
    completedAppointmentsCount: 0,
    totalPatientsCount: 0,
    totalClientsCount: 0,
    totalStaffCount: 0,
    totalConsultationsCount: 0,
    todayAppointments: [],
    recentPatients: [],
  })

  const loadDashboardData = useCallback(async () => {
    if (!activeVetId || isNaN(activeVetId)) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Rango del día actual (00:00:00 a 23:59:59)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const startOfDayIso = `${year}-${month}-${day}T00:00:00`
      const endOfDayIso = `${year}-${month}-${day}T23:59:59`

      // 1. Ejecutar conteos en paralelo para la veterinaria activa
      const [
        patientsRes,
        clientsRes,
        staffRes,
        consultationsRes,
        todayCitasRes,
        recentPetsRes,
      ] = await Promise.all([
        // Pacientes (Mascotas)
        supabase
          .from('mascotas')
          .select('*', { count: 'exact', head: true })
          .eq('id_veterinaria', activeVetId),

        // Clientes (Propietarios)
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('id_veterinaria', activeVetId),

        // Personal (Médico y Administrativo)
        supabase
          .from('personal')
          .select('*', { count: 'exact', head: true })
          .eq('id_veterinaria', activeVetId)
          .eq('estado', 'VIG'),

        // Historias Clínicas (Consultas)
        supabase
          .from('historias_clinicas')
          .select('*', { count: 'exact', head: true })
          .eq('id_veterinaria', activeVetId),

        // Citas programadas para hoy
        supabase
          .from('citas')
          .select('*')
          .eq('id_veterinaria', activeVetId)
          .gte('fecha_inicio', startOfDayIso)
          .lte('fecha_inicio', endOfDayIso)
          .order('fecha_inicio', { ascending: true }),

        // Pacientes más recientes de la veterinaria activa
        supabase
          .from('mascotas')
          .select('id_mascota, nombre, especie, raza, foto_url, fecha_crea, id_cliente')
          .eq('id_veterinaria', activeVetId)
          .order('fecha_crea', { ascending: false })
          .limit(5),
      ])

      // 2. Procesar Citas de Hoy con resolución de nombres de mascotas y clientes
      const rawCitas = todayCitasRes.data || []
      const petIdsFromCitas = Array.from(new Set(rawCitas.map((c) => c.id_mascota).filter(Boolean))) as number[]
      const clientIdsFromCitas = Array.from(new Set(rawCitas.map((c) => c.id_cliente).filter(Boolean))) as number[]

      const [petsMapRes, clientsMapRes] = await Promise.all([
        petIdsFromCitas.length > 0
          ? supabase.from('mascotas').select('id_mascota, nombre, especie, raza').in('id_mascota', petIdsFromCitas)
          : Promise.resolve({ data: [] }),
        clientIdsFromCitas.length > 0
          ? supabase.from('clientes').select('id_cliente, nombres, apellidos').in('id_cliente', clientIdsFromCitas)
          : Promise.resolve({ data: [] }),
      ])

      const petsLookup = new Map<number, { nombre: string; especie?: string; raza?: string | null }>()
      petsMapRes.data?.forEach((p) => petsLookup.set(p.id_mascota, p))

      const clientsLookup = new Map<number, string>()
      clientsMapRes.data?.forEach((c) => {
        const full = `${c.nombres || ''} ${c.apellidos || ''}`.trim()
        clientsLookup.set(c.id_cliente, full)
      })

      let completedCount = 0
      let pendingCount = 0

      const processedTodayAppointments: TodayAppointmentItem[] = rawCitas.map((cita) => {
        const estadoNorm = (cita.estado || '').toUpperCase()
        if (estadoNorm === 'COMPLETADA' || estadoNorm === 'COMPLETED' || estadoNorm === 'ATENDIDA') {
          completedCount++
        } else if (estadoNorm !== 'CANCELADA' && estadoNorm !== 'CANCELLED') {
          pendingCount++
        }

        const pet = petsLookup.get(cita.id_mascota)
        const petName = pet?.nombre || `Paciente #${cita.id_mascota}`
        const speciesBreed = pet ? `${pet.especie || 'Mascota'}${pet.raza ? ` • ${pet.raza}` : ''}` : ''
        const ownerName = clientsLookup.get(cita.id_cliente) || 'Propietario no especificado'

        return {
          id: cita.id_cita,
          time: formatAppointmentTime(cita.fecha_inicio),
          patientName: petName,
          speciesBreed,
          ownerName,
          reason: cita.motivo || cita.observaciones || 'Consulta médica',
          status: cita.estado || 'PENDIENTE',
        }
      })

      // 3. Procesar Pacientes Recientes con nombres de propietarios
      const rawPets = recentPetsRes.data || []
      const clientIdsFromPets = Array.from(new Set(rawPets.map((p) => p.id_cliente).filter(Boolean))) as number[]

      const petOwnersRes = clientIdsFromPets.length > 0
        ? await supabase.from('clientes').select('id_cliente, nombres, apellidos').in('id_cliente', clientIdsFromPets)
        : { data: [] }

      const petOwnersLookup = new Map<number, string>()
      petOwnersRes.data?.forEach((c) => {
        const full = `${c.nombres || ''} ${c.apellidos || ''}`.trim()
        petOwnersLookup.set(c.id_cliente, full)
      })

      const processedRecentPatients: RecentPatientItem[] = rawPets.map((p) => ({
        id: p.id_mascota,
        name: p.nombre,
        species: `${p.especie || 'Mascota'}${p.raza ? ` • ${p.raza}` : ''}`,
        ownerName: petOwnersLookup.get(p.id_cliente) || 'Sin propietario registrado',
        lastVisit: formatRelativeDate(p.fecha_crea),
        avatarUrl: p.foto_url,
      }))

      setMetrics({
        todayAppointmentsCount: rawCitas.length,
        pendingAppointmentsCount: pendingCount,
        completedAppointmentsCount: completedCount,
        totalPatientsCount: patientsRes.count || 0,
        totalClientsCount: clientsRes.count || 0,
        totalStaffCount: staffRes.count || 0,
        totalConsultationsCount: consultationsRes.count || 0,
        todayAppointments: processedTodayAppointments,
        recentPatients: processedRecentPatients,
      })
    } catch (err: any) {
      console.error('Error al cargar datos reales del dashboard:', err)
      setError(err?.message || 'No se pudieron cargar los datos del dashboard desde la base de datos.')
    } finally {
      setIsLoading(false)
    }
  }, [activeVetId])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const statsCards = [
    {
      title: 'Citas para Hoy',
      value: isLoading ? '...' : metrics.todayAppointmentsCount.toString(),
      detail:
        metrics.todayAppointmentsCount === 0
          ? 'Sin citas programadas hoy'
          : `${metrics.completedAppointmentsCount} completadas, ${metrics.pendingAppointmentsCount} pendientes`,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/50',
      href: '/citas',
    },
    {
      title: 'Pacientes Registrados',
      value: isLoading ? '...' : metrics.totalPatientsCount.toString(),
      detail: 'Mascotas activas en la clínica',
      icon: Dog,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/50',
      href: '/pacientes',
    },
    {
      title: 'Propietarios Activos',
      value: isLoading ? '...' : metrics.totalClientsCount.toString(),
      detail: 'Clientes vinculados a la clínica',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/50',
      href: '/clientes',
    },
    {
      title: 'Consultas Médicas',
      value: isLoading ? '...' : metrics.totalConsultationsCount.toString(),
      detail:
        metrics.totalStaffCount > 0
          ? `${metrics.totalStaffCount} profesionales en el equipo`
          : 'Historias clínicas diligenciadas',
      icon: Stethoscope,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/50',
      href: '/historia-clinica',
    },
  ]

  const clinicName = currentTenant?.name || user?.veterinaria_nombre || 'Clínica Veterinaria'
  const doctorName = user?.nombres || user?.full_name?.split(' ')[0] || 'Doctor'

  return (
    <div className="space-y-6">
      {/* Welcome & Quick actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ¡Hola, {doctorName}! 👋
            </h1>
            {activeVetId && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                ID Clínica: {activeVetId}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Panel principal de <strong className="text-slate-800 dark:text-slate-200">{clinicName}</strong>. Datos en tiempo real extraídos de la base de datos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
            title="Recargar datos de la base de datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Link to="/citas">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Calendar className="w-4 h-4 text-slate-500" />
              Ver Agenda
            </Button>
          </Link>
          <Link to="/pacientes">
            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <PlusCircle className="w-4 h-4" />
              Nuevo Paciente
            </Button>
          </Link>
        </div>
      </div>

      {/* Semantic Error Alert if fetch failed */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-100">Error al conectar con la base de datos</p>
              <p className="text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={loadDashboardData} className="h-7 text-xs border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40">
            Reintentar
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Link key={i} to={stat.href} className="block group">
              <Card className="transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-xs cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.title}</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl border ${stat.bg} ${stat.color} transition-transform group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
                    {stat.detail}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Two columns: Agenda del Día + Pacientes Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Agenda de Citas de Hoy</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Atenciones programadas en el consultorio para la jornada actual
              </CardDescription>
            </div>
            <Link to="/citas">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 gap-1">
                Ver todas <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : metrics.todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-900/40">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 mb-3 shadow-2xs">
                  <Calendar className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay citas programadas para hoy</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 mb-4">
                  La agenda médica de {clinicName} no tiene consultas agendadas para esta fecha.
                </p>
                <Link to="/citas">
                  <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusCircle className="w-4 h-4" />
                    Agendar Nueva Cita
                  </Button>
                </Link>
              </div>
            ) : (
              metrics.todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {apt.time}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {apt.patientName}
                        {apt.speciesBreed && (
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                            ({apt.speciesBreed})
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Dueño: <span className="font-medium text-slate-700 dark:text-slate-300">{apt.ownerName}</span> • {apt.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {renderStatusBadge(apt.status)}
                    <Link to="/historia-clinica">
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                        Atender
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Patients Column (1 col) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Pacientes Recientes</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Últimas mascotas registradas</CardDescription>
            </div>
            <Link to="/pacientes">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 gap-1">
                Ver todos <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : metrics.recentPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-900/40">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 mb-3 shadow-2xs">
                  <Dog className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay pacientes registrados</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 mb-4">
                  Aún no se han registrado mascotas para esta clínica.
                </p>
                <Link to="/pacientes">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                    <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Registrar Mascota
                  </Button>
                </Link>
              </div>
            ) : (
              metrics.recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={patient.avatarUrl}
                      fallback={patient.name}
                      className="w-10 h-10 border-emerald-100 dark:border-emerald-900/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{patient.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{patient.species}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Resp: {patient.ownerName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                    {patient.lastVisit}
                  </span>
                </div>
              ))
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 text-xs">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">
                  Datos vinculados a <strong className="text-emerald-950 dark:text-emerald-200">{clinicName}</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
