import React, { useState, useEffect } from 'react'
import {
  X,
  Search,
  Scissors,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  User,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/stores/useToastStore'
import { patientsService } from '@/services/patients.service'
import { cirugiasService } from '@/services/cirugias.service'
import { nuevaCirugiaSchema } from '@/types/cirugia.types'
import type { MascotaConCliente } from '@/types/patient.types'

interface NewSurgeryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  idVeterinaria: number
  initialPatient?: MascotaConCliente | null
}

export const NewSurgeryModal: React.FC<NewSurgeryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  idVeterinaria,
  initialPatient = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState<MascotaConCliente[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<MascotaConCliente | null>(null)

  // Default: mañana a las 09:00 AM
  const [fechaCirugia, setFechaCirugia] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    const tzOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
  })

  const [procedimiento, setProcedimiento] = useState('')
  const [cirujano, setCirujano] = useState('')
  const [anestesia, setAnestesia] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setErrors({})
      if (initialPatient) {
        setSelectedPatient(initialPatient)
      } else {
        setSelectedPatient(null)
        loadPatients('')
      }
      setProcedimiento('')
      setCirujano('')
      setAnestesia('')
      setObservaciones('')
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
      const tzOffset = d.getTimezoneOffset() * 60000
      setFechaCirugia(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16))
    }
  }, [isOpen, initialPatient])

  const loadPatients = async (search: string) => {
    try {
      setIsLoadingPatients(true)
      const data = await patientsService.getPatients(idVeterinaria, {
        searchTerm: search,
      })
      setPatients(data)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar la lista de pacientes')
    } finally {
      setIsLoadingPatients(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchTerm(val)
    loadPatients(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPatient) {
      setErrors({ id_mascota: 'Debe seleccionar un paciente' })
      return
    }

    // Regla de Negocio: Mascota con estado EPC (Eliminada Por Cliente)
    if (selectedPatient.estado === 'EPC') {
      toast.error('No se puede programar cirugía para un paciente marcado como Eliminado por el Cliente (EPC)')
      return
    }

    const payload = {
      id_mascota: selectedPatient.id_mascota,
      fecha_cirugia: new Date(fechaCirugia).toISOString(),
      procedimiento: procedimiento.trim(),
      cirujano: cirujano.trim(),
      anestesia: anestesia.trim() || null,
      observaciones: observaciones.trim() || null,
    }

    const validation = nuevaCirugiaSchema.safeParse(payload)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    try {
      setIsSubmitting(true)
      await cirugiasService.crearCirugia({
        ...payload,
        id_veterinaria: idVeterinaria,
      })

      toast.success(`Cirugía de ${payload.procedimiento} programada exitosamente`)
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Error al agendar la cirugía')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                Programar Intervención Quirúrgica
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agendamiento de quirófano, cirujano responsable y protocolo anestésico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Selector de Mascota */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Paciente a Intervenir *
            </label>

            {selectedPatient ? (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedPatient.foto_url}
                    fallback={selectedPatient.nombre || 'PET'}
                    className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {selectedPatient.nombre}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {selectedPatient.especie} {selectedPatient.raza ? `• ${selectedPatient.raza}` : ''}
                      </Badge>
                      {selectedPatient.estado === 'EPC' && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertTriangle className="w-3 h-3" /> Eliminado por Cliente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tutor: {selectedPatient.cliente ? `${selectedPatient.cliente.nombres} ${selectedPatient.cliente.apellidos || ''}` : 'Sin tutor'}
                      {selectedPatient.cliente?.telefono && ` • Tel: ${selectedPatient.cliente.telefono}`}
                    </p>
                  </div>
                </div>

                {!initialPatient && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cambiar
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar paciente por nombre, raza o tutor..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-9 text-xs"
                  />
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingPatients ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin inline-block mr-2 text-indigo-600" />
                      Buscando pacientes...
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No se encontraron pacientes
                    </div>
                  ) : (
                    patients.map((pet) => {
                      const isEpc = pet.estado === 'EPC'
                      return (
                        <div
                          key={pet.id_mascota}
                          onClick={() => {
                            if (isEpc) {
                              toast.warning('Esta mascota fue eliminada por el cliente y no puede someterse a cirugía')
                              return
                            }
                            setSelectedPatient(pet)
                          }}
                          className={`p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isEpc
                              ? 'opacity-50 bg-rose-50/30 dark:bg-rose-950/20 cursor-not-allowed'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {pet.nombre}
                            </span>
                            <span className="text-slate-500">
                              ({pet.especie} {pet.raza ? `- ${pet.raza}` : ''})
                            </span>
                            {isEpc && (
                              <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                                EPC
                              </Badge>
                            )}
                          </div>
                          <span className="text-slate-400">
                            {pet.cliente ? `${pet.cliente.nombres} ${pet.cliente.apellidos || ''}` : 'Sin tutor'}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
            {errors.id_mascota && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.id_mascota}
              </p>
            )}
          </div>

          {/* 2. Fecha y Procedimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Fecha y Hora de Quirófano *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  type="datetime-local"
                  value={fechaCirugia}
                  onChange={(e) => setFechaCirugia(e.target.value)}
                  className="pl-9 text-xs"
                  required
                />
              </div>
              {errors.fecha_cirugia && (
                <p className="text-xs text-rose-500">{errors.fecha_cirugia}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cirujano Responsable *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Ej: Dr. Fernando Arce"
                  value={cirujano}
                  onChange={(e) => setCirujano(e.target.value)}
                  className="pl-9 text-xs"
                  required
                />
              </div>
              {errors.cirujano && (
                <p className="text-xs text-rose-500">{errors.cirujano}</p>
              )}
            </div>
          </div>

          {/* 3. Nombre del Procedimiento */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Procedimiento / Tipo de Cirugía *
            </label>
            <Input
              type="text"
              placeholder="Ej: Ovariohisterectomía (OVH), Osteosíntesis de fémur, Profilaxis dental..."
              value={procedimiento}
              onChange={(e) => setProcedimiento(e.target.value)}
              className="text-xs"
              required
            />
            {errors.procedimiento && (
              <p className="text-xs text-rose-500">{errors.procedimiento}</p>
            )}
          </div>

          {/* 4. Protocolo Anestésico */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Protocolo Anestésico Recomendado (Opcional)
            </label>
            <Input
              type="text"
              placeholder="Ej: Inhalatoria Isoflurano + Premedicación Midazolam / Tramadol + Inducción Propofol"
              value={anestesia}
              onChange={(e) => setAnestesia(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* 5. Observaciones prequirúrgicas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Instrucciones y Recomendaciones Pre-Quirúrgicas
            </label>
            <textarea
              rows={2}
              placeholder="Ayuno de sólidos 12h y líquidos 4h, análisis hematológico previo, fluidoterapia previa..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !selectedPatient || selectedPatient.estado === 'EPC'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Programación
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
