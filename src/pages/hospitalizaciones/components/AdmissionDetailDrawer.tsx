import React, { useState, useEffect } from 'react'
import {
  X,
  BedDouble,
  Clock,
  HeartPulse,
  Activity,
  User,
  Calendar,
  Phone,
  MessageCircle,
  Plus,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  Pill,
  Thermometer,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/stores/useToastStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { hospitalizacionesService } from '@/services/hospitalizaciones.service'
import { formatDateTime, formatDate } from '@/lib/utils'
import type {
  Hospitalizacion,
  EvolucionHospitalizacion,
} from '@/types/hospitalizacion.types'

interface AdmissionDetailDrawerProps {
  isOpen: boolean
  admission: Hospitalizacion | null
  onClose: () => void
  onDischargeClick: (admission: Hospitalizacion) => void
  onAdmissionUpdated: () => void
}

export const AdmissionDetailDrawer: React.FC<AdmissionDetailDrawerProps> = ({
  isOpen,
  admission,
  onClose,
  onDischargeClick,
  onAdmissionUpdated,
}) => {
  const user = useAuthStore((state) => state.user)
  const [evolutions, setEvolutions] = useState<EvolucionHospitalizacion[]>([])
  const [isLoadingEvolutions, setIsLoadingEvolutions] = useState(false)
  const [isAddingEvolution, setIsAddingEvolution] = useState(false)

  // Formulario de nueva evolución
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNota, setNewNota] = useState('')
  const [newTemperatura, setNewTemperatura] = useState('')
  const [newPeso, setNewPeso] = useState('')
  const [newFC, setNewFC] = useState('')
  const [newFR, setNewFR] = useState('')
  const [newTratamiento, setNewTratamiento] = useState('')

  useEffect(() => {
    if (isOpen && admission) {
      loadEvolutions()
      setShowAddForm(false)
      resetForm()
    }
  }, [isOpen, admission])

  const loadEvolutions = async () => {
    if (!admission) return
    try {
      setIsLoadingEvolutions(true)
      const data = await hospitalizacionesService.getEvoluciones(
        admission.id_hospitalizacion
      )
      setEvolutions(data)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar historial de evoluciones')
    } finally {
      setIsLoadingEvolutions(false)
    }
  }

  const resetForm = () => {
    setNewNota('')
    setNewTemperatura('')
    setNewPeso('')
    setNewFC('')
    setNewFR('')
    setNewTratamiento('')
  }

  if (!isOpen || !admission) return null

  const pet = admission.mascota
  const client = pet?.cliente

  // Cálculo de estadía
  const calculateDays = () => {
    const start = new Date(admission.fecha_ingreso).getTime()
    const end = admission.fecha_alta ? new Date(admission.fecha_alta).getTime() : Date.now()
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((end - start) / (1000 * 60 * 60))
    if (diffDays <= 0) {
      return `${Math.max(1, diffHours)} horas`
    }
    return `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
  }

  // Enlace a WhatsApp
  const handleWhatsApp = () => {
    if (!client?.telefono) {
      toast.warning('El tutor no tiene registrado un número telefónico')
      return
    }
    const cleanPhone = client.telefono.replace(/\D/g, '')
    const targetPhone = cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`
    const message = encodeURIComponent(
      `Hola ${client.nombres || ''}, te escribo de la veterinaria para informarte sobre ${pet?.nombre || 'tu mascota'}. Actualmente continúa internado. Motivo de ingreso: ${admission.motivo_ingreso}. Ubicación: ${admission.habitacion || 'Hospitalización'}.`
    )
    window.open(`https://wa.me/${targetPhone}?text=${message}`, '_blank')
  }

  // Impresión de Ficha Clínica
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const evolutionsHtml = evolutions
      .map(
        (ev) => `
        <div style="border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-size: 12px;">
          <div style="font-weight: bold; color: #1e293b;">
            ${new Date(ev.fecha_evolucion).toLocaleString('es-BO')} 
            ${ev.personal ? ` • Atendido por: ${ev.personal.nombres} ${ev.personal.apellidos}` : ''}
          </div>
          <div style="margin: 4px 0; color: #475569;">
            ${ev.temperatura ? `<b>Temp:</b> ${ev.temperatura}°C &nbsp; ` : ''}
            ${ev.peso ? `<b>Peso:</b> ${ev.peso} kg &nbsp; ` : ''}
            ${ev.frecuencia_cardiaca ? `<b>FC:</b> ${ev.frecuencia_cardiaca} lpm &nbsp; ` : ''}
            ${ev.frecuencia_respiratoria ? `<b>FR:</b> ${ev.frecuencia_respiratoria} rpm` : ''}
          </div>
          <p style="margin: 4px 0; color: #0f172a;"><b>Nota:</b> ${ev.nota}</p>
          ${ev.tratamiento ? `<p style="margin: 4px 0; color: #047857;"><b>Tratamiento:</b> ${ev.tratamiento}</p>` : ''}
        </div>
      `
      )
      .join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha de Hospitalización - ${pet?.nombre || 'Paciente'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; color: #0f172a; }
            .header-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; background: #e0f2fe; color: #0369a1; }
          </style>
        </head>
        <body>
          <h1>REPORTE DE HOSPITALIZACIÓN VETERINARIA</h1>
          <p style="font-size: 12px; color: #64748b; margin-top: 0;">Generado el ${new Date().toLocaleString('es-BO')}</p>
          
          <div class="header-box">
            <b>Paciente:</b> ${pet?.nombre || ''} (${pet?.especie || ''} ${pet?.raza ? ` - ${pet.raza}` : ''})<br/>
            <b>Tutor:</b> ${client?.nombres || ''} ${client?.apellidos || ''} ${client?.telefono ? ` • Tel: ${client.telefono}` : ''}<br/>
            <b>Jaula / Box:</b> ${admission.habitacion || 'Sin asignar'}<br/>
            <b>Estado:</b> <span class="badge">${admission.estado}</span><br/>
            <b>Fecha Ingreso:</b> ${new Date(admission.fecha_ingreso).toLocaleString('es-BO')}<br/>
            ${admission.fecha_alta ? `<b>Fecha Alta:</b> ${new Date(admission.fecha_alta).toLocaleString('es-BO')}<br/>` : ''}
            <b>Motivo Ingreso:</b> ${admission.motivo_ingreso}<br/>
            ${admission.observaciones ? `<b>Observaciones / Indicaciones:</b> ${admission.observaciones}` : ''}
          </div>

          <h3 style="font-size: 15px; border-bottom: 2px solid #0f172a; padding-bottom: 4px; margin-top: 20px;">
            HISTORIAL DE EVOLUCIONES CLÍNICAS (${evolutions.length})
          </h3>
          ${evolutions.length > 0 ? evolutionsHtml : '<p style="font-size: 12px; color: #94a3b8;">Sin notas de evolución registradas.</p>'}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  // Guardar nueva nota de evolución
  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNota.trim()) {
      toast.warning('Ingrese la nota clínica de la evolución')
      return
    }

    try {
      setIsAddingEvolution(true)
      const created = await hospitalizacionesService.addEvolucion({
        id_hospitalizacion: admission.id_hospitalizacion,
        nota: newNota.trim(),
        temperatura: newTemperatura.trim() || null,
        peso: newPeso.trim() || null,
        frecuencia_cardiaca: newFC.trim() || null,
        frecuencia_respiratoria: newFR.trim() || null,
        tratamiento: newTratamiento.trim() || null,
        id_personal: user?.id_persona ? Number(user.id_persona) : null,
      })

      setEvolutions([created, ...evolutions])
      toast.success('Nota de evolución registrada exitosamente')
      resetForm()
      setShowAddForm(false)
      onAdmissionUpdated()
    } catch (err) {
      console.error(err)
      toast.error('Error al registrar la evolución médica')
    } finally {
      setIsAddingEvolution(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Avatar
              src={pet?.foto_url}
              fallback={pet?.nombre || 'VET'}
              className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {pet?.nombre}
                </h3>
                <Badge
                  variant={
                    admission.estado === 'INTERNADO'
                      ? 'warning'
                      : admission.estado === 'ALTA'
                      ? 'success'
                      : 'destructive'
                  }
                  className="text-xs"
                >
                  {admission.estado === 'INTERNADO' ? 'Internado Activo' : admission.estado}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pet?.especie} {pet?.raza ? `• ${pet.raza}` : ''} | Tutor: {client?.nombres || 'Sin tutor'} {client?.apellidos || ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              className="text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Tutor
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Reporte Clínico
            </Button>
          </div>

          {admission.estado === 'INTERNADO' && (
            <Button
              type="button"
              size="sm"
              onClick={() => onDischargeClick(admission)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Dar de Alta
            </Button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card Resumen de Hospitalización */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Habitación / Jaula</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {admission.habitacion || 'Sin asignar'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Días Internado</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {calculateDays()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Fecha Ingreso</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatDateTime(admission.fecha_ingreso)}
                </span>
              </div>
              {admission.fecha_alta && (
                <div>
                  <span className="text-slate-400 block">Fecha Alta</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatDateTime(admission.fecha_alta)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Motivo de Ingreso:{' '}
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                {admission.motivo_ingreso}
              </span>
            </div>

            {admission.observaciones && (
              <div className="text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {admission.estado === 'ALTA' ? 'Indicaciones de Egreso: ' : 'Observaciones: '}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {admission.observaciones}
                </span>
              </div>
            )}
          </div>

          {/* Formulario Registro de Nueva Evolución (Colapsable) */}
          {admission.estado === 'INTERNADO' && (
            <div className="border border-amber-200/80 dark:border-amber-900/50 rounded-xl overflow-hidden bg-amber-50/20 dark:bg-amber-950/10">
              <div
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Registrar Control Clínico / Evolución Horaria
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-amber-700 dark:text-amber-400"
                >
                  {showAddForm ? 'Ocultar Formulario' : '+ Nueva Nota'}
                </Button>
              </div>

              {showAddForm && (
                <form onSubmit={handleSaveEvolution} className="p-4 border-t border-amber-100 dark:border-amber-900/40 space-y-3 bg-white dark:bg-slate-900">
                  {/* Constantes vitales */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-rose-500" /> Temp (°C)
                      </label>
                      <input
                        type="text"
                        placeholder="38.5"
                        value={newTemperatura}
                        onChange={(e) => setNewTemperatura(e.target.value)}
                        className="mt-1 w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-emerald-500" /> Peso (kg)
                      </label>
                      <input
                        type="text"
                        placeholder="12.4"
                        value={newPeso}
                        onChange={(e) => setNewPeso(e.target.value)}
                        className="mt-1 w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <HeartPulse className="w-3 h-3 text-red-500" /> FC (lpm)
                      </label>
                      <input
                        type="text"
                        placeholder="110"
                        value={newFC}
                        onChange={(e) => setNewFC(e.target.value)}
                        className="mt-1 w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-500" /> FR (rpm)
                      </label>
                      <input
                        type="text"
                        placeholder="28"
                        value={newFR}
                        onChange={(e) => setNewFR(e.target.value)}
                        className="mt-1 w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                  </div>

                  {/* Nota */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Nota Médica / Evolución del Paciente *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describa el estado de alerta, apetito, hidratación, micción, heces o respuesta al tratamiento..."
                      value={newNota}
                      onChange={(e) => setNewNota(e.target.value)}
                      className="mt-1 w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Tratamiento aplicado */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Pill className="w-3 h-3 text-emerald-600" /> Tratamiento / Fluidoterapia / Fármacos Administrados
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Ringer Lactato 40ml/h, Ceftriaxona 250mg IV, Ranitidina..."
                      value={newTratamiento}
                      onChange={(e) => setNewTratamiento(e.target.value)}
                      className="mt-1 w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isAddingEvolution}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                    >
                      {isAddingEvolution ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Registrar Control
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Timeline de Evoluciones */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              Historial de Evolución Diaria ({evolutions.length})
            </h4>

            {isLoadingEvolutions ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin inline-block text-amber-600 mb-2" />
                <p>Cargando notas horarias de evolución...</p>
              </div>
            ) : evolutions.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
                Aún no se han registrado notas de evolución para esta hospitalización.
              </div>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {evolutions.map((ev) => (
                  <div
                    key={ev.id_evolucion}
                    className="relative pl-8 space-y-2 group"
                  >
                    <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-amber-500 bg-white dark:bg-slate-900 group-hover:scale-125 transition-transform" />

                    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTime(ev.fecha_evolucion)}
                        </span>
                        {ev.personal && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <User className="w-3 h-3" />
                            {ev.personal.nombres} {ev.personal.apellidos}
                          </span>
                        )}
                      </div>

                      {/* Chips de constantes */}
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {ev.temperatura && (
                          <Badge variant="outline" className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30">
                            Temp: {ev.temperatura}°C
                          </Badge>
                        )}
                        {ev.peso && (
                          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30">
                            Peso: {ev.peso} kg
                          </Badge>
                        )}
                        {ev.frecuencia_cardiaca && (
                          <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30">
                            FC: {ev.frecuencia_cardiaca} lpm
                          </Badge>
                        )}
                        {ev.frecuencia_respiratoria && (
                          <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30">
                            FR: {ev.frecuencia_respiratoria} rpm
                          </Badge>
                        )}
                      </div>

                      {/* Texto de la nota */}
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        {ev.nota}
                      </p>

                      {/* Tratamiento aplicado */}
                      {ev.tratamiento && (
                        <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                          <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                            Tratamiento aplicado:{' '}
                          </span>
                          {ev.tratamiento}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
