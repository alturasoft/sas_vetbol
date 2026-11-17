import React, { useState, useEffect, useCallback } from 'react'
import { Search, User, Dog, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { clientsService } from '@/services/clients.service'
import { patientsService } from '@/services/patients.service'
import type { Clientes, Mascotas } from '@/types/database.types'
import type { NewAppointmentFormState } from '@/types/appointment.types'

interface StepPatientSelectionProps {
  vetId: number
  formState: NewAppointmentFormState
  onChange: (updates: Partial<NewAppointmentFormState>) => void
}

export const StepPatientSelection: React.FC<StepPatientSelectionProps> = ({
  vetId,
  formState,
  onChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<Clientes[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [pets, setPets] = useState<Mascotas[]>([])
  const [isLoadingPets, setIsLoadingPets] = useState(false)

  // Cargar clientes iniciales o al buscar
  const searchClients = useCallback(
    async (term: string) => {
      try {
        setIsLoadingClients(true)
        const data = await clientsService.getClients(vetId, { searchTerm: term })
        setClients(data)
      } catch (err) {
        console.error('Error al buscar clientes:', err)
      } finally {
        setIsLoadingClients(false)
      }
    },
    [vetId]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      searchClients(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, searchClients])

  // Cargar mascotas al seleccionar cliente
  useEffect(() => {
    if (!formState.selectedClient) {
      setPets([])
      return
    }

    let isMounted = true
    const loadPets = async () => {
      try {
        setIsLoadingPets(true)
        const data = await patientsService.getPatients(vetId, {
          idCliente: formState.selectedClient?.id_cliente,
        })
        if (isMounted) {
          setPets(data as unknown as Mascotas[])
        }
      } catch (err) {
        console.error('Error al cargar mascotas del cliente:', err)
      } finally {
        if (isMounted) setIsLoadingPets(false)
      }
    }

    loadPets()
    return () => {
      isMounted = false
    }
  }, [vetId, formState.selectedClient])

  const handleSelectClient = (client: Clientes) => {
    onChange({
      selectedClient: {
        id_cliente: client.id_cliente,
        nombres: client.nombres,
        apellidos: client.apellidos,
        telefono: client.telefono,
        email: client.email,
        ci: client.numero_ci,
      },
      selectedPet: null, // Reiniciar mascota al cambiar de cliente
    })
  }

  const handleSelectPet = (pet: Mascotas) => {
    if (pet.estado === 'EPC') return // Restricción regla EPC

    onChange({
      selectedPet: {
        id_mascota: pet.id_mascota,
        nombre: pet.nombre,
        especie: pet.especie,
        raza: pet.raza,
        sexo: pet.sexo,
        foto_url: pet.foto_url,
        estado: pet.estado,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Sección 1: Selección de Propietario */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          1. Seleccionar Propietario / Cliente *
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, CI o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
          />
          {isLoadingClients && (
            <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Lista de Clientes Encontrados */}
        <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          {clients.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
              {isLoadingClients ? 'Buscando clientes...' : 'No se encontraron clientes.'}
            </div>
          ) : (
            clients.map((client) => {
              const isSelected = formState.selectedClient?.id_cliente === client.id_cliente
              return (
                <button
                  key={client.id_cliente}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className={`w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {client.nombres} {client.apellidos}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">
                        {client.numero_ci ? `CI: ${client.numero_ci}` : ''}
                        {client.telefono ? ` • Tel: ${client.telefono}` : ''}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Sección 2: Selección de Mascota */}
      {formState.selectedClient && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. Seleccionar Mascota de {formState.selectedClient.nombres} *
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
              {pets.length} registrada{pets.length === 1 ? '' : 's'}
            </span>
          </div>

          {isLoadingPets ? (
            <div className="flex items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40">
              <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin mr-2" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cargando pacientes...</span>
            </div>
          ) : pets.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <Dog className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Este cliente no tiene mascotas registradas</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">
                Registra una mascota primero para poder agendar una cita.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pets.map((pet) => {
                const isEpc = pet.estado === 'EPC'
                const isSelected = formState.selectedPet?.id_mascota === pet.id_mascota

                return (
                  <button
                    key={pet.id_mascota}
                    type="button"
                    disabled={isEpc}
                    onClick={() => handleSelectPet(pet)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      isEpc
                        ? 'opacity-55 bg-slate-50 dark:bg-slate-900/40 border-rose-200 dark:border-rose-900/50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500 dark:ring-emerald-500/50 shadow-sm cursor-pointer'
                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <OptimizedImage
                          src={pet.foto_url}
                          alt={pet.nombre}
                          containerClassName="w-full h-full"
                          fallback={<Dog className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{pet.nombre}</span>
                          {isEpc && (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-transparent dark:border-rose-900/50 text-[10px] font-bold inline-flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              EPC
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {pet.especie} {pet.raza ? `• ${pet.raza}` : ''}
                        </div>
                        {isEpc && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                            Eliminada por Cliente
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
