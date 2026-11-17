import { useState, useEffect } from 'react'
import { Search, X, PawPrint, User, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { patientsService } from '@/services/patients.service'
import { useAuthStore } from '@/stores/useAuthStore'
import type { MascotaConCliente } from '@/types/patient.types'

interface PatientSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPatient: (patient: MascotaConCliente) => void
}

export function PatientSelectModal({
  isOpen,
  onClose,
  onSelectPatient,
}: PatientSelectModalProps) {
  const { user } = useAuthStore()
  const [patients, setPatients] = useState<MascotaConCliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?.id_veterinaria) return

    let isMounted = true
    setIsLoading(true)

    patientsService
      .getPatients(user.id_veterinaria)
      .then((data) => {
        if (isMounted) {
          setPatients(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error('Error cargando pacientes:', err)
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, user?.id_veterinaria])

  if (!isOpen) return null

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true
    const petName = p.nombre.toLowerCase()
    const breed = (p.raza || '').toLowerCase()
    const species = (p.especie || '').toLowerCase()
    const ownerName = p.cliente
      ? `${p.cliente.nombres || ''} ${p.cliente.apellidos || ''}`.toLowerCase()
      : ''
    return petName.includes(term) || breed.includes(term) || species.includes(term) || ownerName.includes(term)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <PawPrint className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Seleccionar Paciente para Consulta</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Elige la mascota para iniciar el expediente médico SOAP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buscador */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre de mascota, especie, raza o tutor..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 pl-9 pr-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>
        </div>

        {/* Listado de Pacientes */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              Cargando directorio de pacientes...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No se encontraron pacientes</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Verifica el término ingresado o registra la mascota previamente.
              </p>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const isEPC = patient.estado === 'EPC'
              const ownerFullName = patient.cliente
                ? `${patient.cliente.nombres || ''} ${patient.cliente.apellidos || ''}`.trim()
                : 'Sin tutor asignado'

              return (
                <div
                  key={patient.id_mascota}
                  onClick={() => {
                    if (!isEPC) onSelectPatient(patient)
                  }}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isEPC
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 opacity-60 cursor-not-allowed'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 cursor-pointer shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={patient.foto_url || undefined}
                      fallback={patient.nombre}
                      className="w-10 h-10 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {patient.nombre}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 dark:border-slate-700 dark:text-slate-300">
                          {patient.especie} {patient.raza ? `• ${patient.raza}` : ''}
                        </Badge>
                        {isEPC && (
                          <Badge className="text-[9px] bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50">
                            EPC (Bloqueado)
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        <User className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">Tutor: {ownerFullName}</span>
                        {patient.peso && (
                          <span className="text-slate-400 dark:text-slate-500 ml-1">• {patient.peso} kg</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isEPC && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-xs text-emerald-700 dark:text-emerald-400 gap-1 h-8 shrink-0 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50"
                    >
                      <span>Atender</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Total: {filteredPatients.length} pacientes</span>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs h-8 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
