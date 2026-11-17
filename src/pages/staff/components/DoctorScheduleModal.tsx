import { useState, useEffect } from 'react'
import {
  CalendarClock,
  X,
  Clock,
  Save,
  Loader2,
  CalendarX2,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StaffService } from '@/services/staff.service'
import { toast } from '@/stores/useToastStore'
import type { PersonaStaff, HorarioPersonal, BloqueoAgenda, TipoBloqueoAgenda } from '@/types/staff.types'

interface DoctorScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  doctor: PersonaStaff | null
  clinicId: number
}

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes', short: 'Lun' },
  { id: 2, nombre: 'Martes', short: 'Mar' },
  { id: 3, nombre: 'Miércoles', short: 'Mié' },
  { id: 4, nombre: 'Jueves', short: 'Jue' },
  { id: 5, nombre: 'Viernes', short: 'Vie' },
  { id: 6, nombre: 'Sábado', short: 'Sáb' },
  { id: 7, nombre: 'Domingo', short: 'Dom' },
]

export function DoctorScheduleModal({
  isOpen,
  onClose,
  doctor,
  clinicId,
}: DoctorScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<'turnos' | 'bloqueos'>('turnos')

  // Estado de Turnos Semanales
  const [horarios, setHorarios] = useState<HorarioPersonal[]>([])
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false)
  const [isSavingHorarios, setIsSavingHorarios] = useState(false)

  // Estado de Bloqueos de Agenda
  const [bloqueos, setBloqueos] = useState<BloqueoAgenda[]>([])
  const [isLoadingBloqueos, setIsLoadingBloqueos] = useState(false)
  const [isSavingBloqueo, setIsSavingBloqueo] = useState(false)

  // Formulario de Nuevo Bloqueo
  const [showAddBloqueo, setShowAddBloqueo] = useState(false)
  const [bloqueoFechaInicio, setBloqueoFechaInicio] = useState('')
  const [bloqueoFechaFin, setBloqueoFechaFin] = useState('')
  const [bloqueoTipo, setBloqueoTipo] = useState<TipoBloqueoAgenda>('DESCANSO')
  const [bloqueoMotivo, setBloqueoMotivo] = useState('')

  useEffect(() => {
    if (isOpen && doctor) {
      loadHorarios()
      loadBloqueos()
      setShowAddBloqueo(false)
    }
  }, [isOpen, doctor])

  const loadHorarios = async () => {
    if (!doctor) return
    setIsLoadingHorarios(true)
    try {
      const data = await StaffService.getHorariosByPersona(doctor.id_persona)
      // Construir la matriz completa de 7 días (si no existe un día, inicializarlo desactivado)
      const fullWeek: HorarioPersonal[] = DIAS_SEMANA.map((dia) => {
        const found = data.find((h) => h.dia_semana === dia.id)
        if (found) {
          return {
            ...found,
            hora_inicio: found.hora_inicio.substring(0, 5),
            hora_fin: found.hora_fin.substring(0, 5),
          }
        }
        return {
          id_persona: doctor.id_persona,
          dia_semana: dia.id,
          hora_inicio: '09:00',
          hora_fin: '18:00',
          activo: dia.id <= 5, // Lunes a Viernes por defecto
        }
      })
      setHorarios(fullWeek)
    } catch (err) {
      console.error('Error al cargar horarios:', err)
      toast.error('Error de Carga', 'No se pudieron recuperar los turnos del médico.')
    } finally {
      setIsLoadingHorarios(false)
    }
  }

  const loadBloqueos = async () => {
    if (!doctor) return
    setIsLoadingBloqueos(true)
    try {
      const data = await StaffService.getBloqueos(clinicId, doctor.id_persona)
      setBloqueos(data)
    } catch (err) {
      console.warn('Error al cargar bloqueos:', err)
    } finally {
      setIsLoadingBloqueos(false)
    }
  }

  if (!isOpen || !doctor) return null

  // Manejo de cambios en turnos
  const handleToggleDay = (diaSemana: number) => {
    setHorarios((prev) =>
      prev.map((h) => (h.dia_semana === diaSemana ? { ...h, activo: !h.activo } : h))
    )
  }

  const handleTimeChange = (diaSemana: number, field: 'hora_inicio' | 'hora_fin', value: string) => {
    setHorarios((prev) =>
      prev.map((h) => (h.dia_semana === diaSemana ? { ...h, [field]: value } : h))
    )
  }

  // Preajustes rápidos
  const applyPresetStandard = () => {
    setHorarios((prev) =>
      prev.map((h) => {
        if (h.dia_semana <= 5) {
          return { ...h, activo: true, hora_inicio: '09:00', hora_fin: '18:00' }
        } else if (h.dia_semana === 6) {
          return { ...h, activo: true, hora_inicio: '09:00', hora_fin: '13:00' }
        }
        return { ...h, activo: false }
      })
    )
    toast.info('Preajuste Aplicado', 'Horario comercial estándar cargado.')
  }

  const applyPresetContinuous = () => {
    setHorarios((prev) =>
      prev.map((h) => {
        if (h.dia_semana <= 5) {
          return { ...h, activo: true, hora_inicio: '08:00', hora_fin: '16:00' }
        }
        return { ...h, activo: false }
      })
    )
    toast.info('Preajuste Aplicado', 'Jornada continua matutina cargada.')
  }

  const copyMondayToActive = () => {
    const monday = horarios.find((h) => h.dia_semana === 1)
    if (!monday) return
    setHorarios((prev) =>
      prev.map((h) =>
        h.activo ? { ...h, hora_inicio: monday.hora_inicio, hora_fin: monday.hora_fin } : h
      )
    )
    toast.info('Horarios Replicados', 'Se copió el horario del Lunes a todos los días activos.')
  }

  // Guardar turnos
  const handleSaveHorarios = async () => {
    setIsSavingHorarios(true)
    try {
      await StaffService.saveHorarios(doctor.id_persona, horarios)
      toast.success(
        'Turnos Guardados',
        `Disponibilidad semanal de Dr(a). ${doctor.nombres} ${doctor.apellidos} actualizada.`
      )
      onClose()
    } catch (err: any) {
      console.error('Error al guardar turnos:', err)
      toast.error('Error al Guardar', err.message || 'No se pudieron actualizar los turnos.')
    } finally {
      setIsSavingHorarios(false)
    }
  }

  // Crear nuevo bloqueo
  const handleCreateBloqueo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bloqueoFechaInicio || !bloqueoFechaFin) {
      toast.warning('Datos incompletos', 'Selecciona fecha y hora de inicio y fin.')
      return
    }

    if (new Date(bloqueoFechaInicio) >= new Date(bloqueoFechaFin)) {
      toast.error('Rango inválido', 'La fecha de fin debe ser posterior a la fecha de inicio.')
      return
    }

    setIsSavingBloqueo(true)
    try {
      await StaffService.createBloqueo({
        id_veterinaria: clinicId,
        id_persona: doctor.id_persona,
        fecha_inicio: new Date(bloqueoFechaInicio).toISOString(),
        fecha_fin: new Date(bloqueoFechaFin).toISOString(),
        tipo_bloqueo: bloqueoTipo,
        motivo: bloqueoMotivo,
      })
      toast.success('Bloqueo Registrado', 'Se agendó la excepción de disponibilidad.')
      setShowAddBloqueo(false)
      setBloqueoFechaInicio('')
      setBloqueoFechaFin('')
      setBloqueoMotivo('')
      loadBloqueos()
    } catch (err: any) {
      console.error('Error al crear bloqueo:', err)
      toast.error('Error', err.message || 'No se pudo crear el bloqueo de agenda.')
    } finally {
      setIsSavingBloqueo(false)
    }
  }

  // Eliminar bloqueo
  const handleDeleteBloqueo = async (idBloqueo: number) => {
    try {
      await StaffService.deleteBloqueo(idBloqueo)
      toast.success('Bloqueo Eliminado', 'Se liberó la disponibilidad en la agenda.')
      loadBloqueos()
    } catch (err) {
      console.error('Error eliminando bloqueo:', err)
      toast.error('Error', 'No se pudo eliminar el bloqueo.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Disponibilidad y Horarios de Atención
              </h2>
              <p className="text-xs text-slate-500">
                Dr(a). {doctor.nombres} {doctor.apellidos} &bull; Definición de turnos para agendamiento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 px-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('turnos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'turnos'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Turnos Semanales (Lunes a Domingo)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bloqueos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'bloqueos'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarX2 className="w-4 h-4" />
            Bloqueos y Ausencias ({bloqueos.length})
          </button>
        </div>

        {/* Tab 1: Turnos Semanales */}
        {activeTab === 'turnos' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Quick preset banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Preajustes Rápidos:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyPresetStandard}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                >
                  Estándar (Lun-Vie 9-18, Sáb 9-13)
                </button>
                <button
                  type="button"
                  onClick={applyPresetContinuous}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                >
                  Continuo (8:00 - 16:00)
                </button>
                <button
                  type="button"
                  onClick={copyMondayToActive}
                  className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  Copiar Lunes a Activos
                </button>
              </div>
            </div>

            {/* Listado de Días */}
            {isLoadingHorarios ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs">Cargando turnos semanales...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {horarios.map((h) => {
                  const diaInfo = DIAS_SEMANA.find((d) => d.id === h.dia_semana)
                  return (
                    <div
                      key={h.dia_semana}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        h.activo
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <input
                          type="checkbox"
                          id={`dia-${h.dia_semana}`}
                          checked={h.activo}
                          onChange={() => handleToggleDay(h.dia_semana)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`dia-${h.dia_semana}`}
                          className="text-xs font-bold text-slate-800 cursor-pointer select-none"
                        >
                          {diaInfo?.nombre}
                        </label>
                      </div>

                      {h.activo ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">De</span>
                          <Input
                            type="time"
                            value={h.hora_inicio}
                            onChange={(e) =>
                              handleTimeChange(h.dia_semana, 'hora_inicio', e.target.value)
                            }
                            className="w-28 text-xs h-8"
                          />
                          <span className="text-[11px] text-slate-500">a</span>
                          <Input
                            type="time"
                            value={h.hora_fin}
                            onChange={(e) =>
                              handleTimeChange(h.dia_semana, 'hora_fin', e.target.value)
                            }
                            className="w-28 text-xs h-8"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic pr-4">
                          Descanso / No disponible
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer de Acciones */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSavingHorarios}
                className="text-xs"
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={handleSaveHorarios}
                disabled={isSavingHorarios || isLoadingHorarios}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
              >
                {isSavingHorarios ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Turnos
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Bloqueos de Agenda */}
        {activeTab === 'bloqueos' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Excepciones y Ausencias Programadas
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bloquea citas por vacaciones, descansos, cirugías o feriados
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setShowAddBloqueo(!showAddBloqueo)}
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddBloqueo ? 'Cancelar' : 'Nuevo Bloqueo'}
              </Button>
            </div>

            {/* Formulario para agregar nuevo bloqueo */}
            {showAddBloqueo && (
              <form
                onSubmit={handleCreateBloqueo}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Fecha y Hora Inicio</label>
                    <Input
                      type="datetime-local"
                      value={bloqueoFechaInicio}
                      onChange={(e) => setBloqueoFechaInicio(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Fecha y Hora Fin</label>
                    <Input
                      type="datetime-local"
                      value={bloqueoFechaFin}
                      onChange={(e) => setBloqueoFechaFin(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Tipo de Bloqueo</label>
                    <select
                      value={bloqueoTipo}
                      onChange={(e) => setBloqueoTipo(e.target.value as TipoBloqueoAgenda)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="DESCANSO">Descanso Programado</option>
                      <option value="VACACION">Vacaciones</option>
                      <option value="CIRUGIA">Cirugía Exclusiva</option>
                      <option value="FERIADO">Feriado / Asueto</option>
                      <option value="EMERGENCIA">Emergencia / Permiso</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Motivo / Descripción</label>
                    <Input
                      value={bloqueoMotivo}
                      onChange={(e) => setBloqueoMotivo(e.target.value)}
                      placeholder="Ej. Vacaciones de verano"
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={isSavingBloqueo}
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    {isSavingBloqueo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar Bloqueo
                  </Button>
                </div>
              </form>
            )}

            {/* Listado de bloqueos existentes */}
            {isLoadingBloqueos ? (
              <div className="py-8 flex justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            ) : bloqueos.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-400">
                <CalendarClock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No hay ausencias ni bloqueos registrados</p>
                <p className="text-[11px] text-slate-400 mt-0.5">El médico cuenta con disponibilidad regular.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bloqueos.map((b) => (
                  <div
                    key={b.id_bloqueo}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          {b.tipo_bloqueo}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {b.motivo || 'Sin motivo especificado'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Desde: {new Date(b.fecha_inicio).toLocaleString()} &bull; Hasta:{' '}
                        {new Date(b.fecha_fin).toLocaleString()}
                      </div>
                    </div>
                    {b.id_bloqueo && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBloqueo(b.id_bloqueo!)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar bloqueo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
