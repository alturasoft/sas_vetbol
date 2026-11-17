import { useState, useEffect } from 'react'
import {
  X,
  Mail,
  Phone,
  CalendarClock,
  Shield,
  Edit2,
  Stethoscope,
  Briefcase,
  Crown,
  Clock,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StaffService } from '@/services/staff.service'
import type { PersonaStaff, HorarioPersonal } from '@/types/staff.types'

interface StaffDetailModalProps {
  isOpen: boolean
  onClose: () => void
  staff: PersonaStaff | null
  onEditClick: () => void
  onScheduleClick: () => void
}

const DIAS_NOMBRES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function StaffDetailModal({
  isOpen,
  onClose,
  staff,
  onEditClick,
  onScheduleClick,
}: StaffDetailModalProps) {
  const [horarios, setHorarios] = useState<HorarioPersonal[]>([])
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false)

  useEffect(() => {
    if (isOpen && staff && staff.rol === 'MED') {
      loadHorarios()
    } else {
      setHorarios([])
    }
  }, [isOpen, staff])

  const loadHorarios = async () => {
    if (!staff) return
    setIsLoadingHorarios(true)
    try {
      const data = await StaffService.getHorariosByPersona(staff.id_persona)
      setHorarios(data)
    } catch (err) {
      console.warn('Error al cargar horarios para detalle:', err)
    } finally {
      setIsLoadingHorarios(false)
    }
  }

  if (!isOpen || !staff) return null

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'PRO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Propietario / Director
          </span>
        )
      case 'MED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            Médico Veterinario
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            Personal Administrativo
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Ficha del Colaborador
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            {staff.foto_url ? (
              <img
                src={staff.foto_url}
                alt={staff.nombres}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl border-2 border-emerald-200">
                {(staff.nombres[0] || 'V') + (staff.apellidos[0] || 'T')}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">
                  {staff.nombres} {staff.apellidos}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                  Activo (VIG)
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                {getRoleBadge(staff.rol)}
                {staff.rol_info && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700">
                    <Shield className="w-3 h-3 text-slate-500" />
                    {staff.rol_info.nombre}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                <Mail className="w-3.5 h-3.5" />
                Correo de Acceso
              </div>
              <div className="text-xs font-bold text-slate-800 truncate" title={staff.email}>
                {staff.email}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                <Phone className="w-3.5 h-3.5" />
                Teléfono / WhatsApp
              </div>
              <div className="text-xs font-bold text-slate-800">
                {staff.telefono || 'No registrado'}
              </div>
            </div>
          </div>

          {/* Horarios de Atención (Solo si es MED) */}
          {staff.rol === 'MED' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-emerald-600" />
                  Turnos Semanales de Atención
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onScheduleClick()
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  Configurar
                </button>
              </div>

              {isLoadingHorarios ? (
                <div className="py-6 flex justify-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                </div>
              ) : horarios.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500">
                  No hay turnos configurados aún.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {horarios.map((h) => (
                    <div
                      key={h.id_horario || h.dia_semana}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 text-xs"
                    >
                      <span className="font-semibold text-slate-700">
                        {DIAS_NOMBRES[h.dia_semana]}
                      </span>
                      <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        {h.hora_inicio.substring(0, 5)} - {h.hora_fin.substring(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            {staff.rol === 'MED' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose()
                  onScheduleClick()
                }}
                className="gap-1.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <CalendarClock className="w-4 h-4" />
                Horarios
              </Button>
            )}

            <Button
              type="button"
              onClick={() => {
                onClose()
                onEditClick()
              }}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              Editar Perfil
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
