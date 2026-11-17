import { useState, useEffect, useRef } from 'react'
import {
  X,
  Camera,
  Trash2,
  Sparkles,
  Save,
  Dog,
  PawPrint,
  Calendar,
  Weight,
  User,
  AlertCircle,
  Search,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import {
  PET_SPECIES,
  DOG_BREEDS,
  CAT_BREEDS,
  type PetSpeciesType,
} from '@/constants/petCatalogs'
import { optimizeImage, formatBytes } from '@/lib/imageOptimization'
import { patientsService } from '@/services/patients.service'
import { clientsService } from '@/services/clients.service'
import { storageService } from '@/services/storage.service'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from '@/stores/useToastStore'
import type { MascotaConCliente, Mascotas } from '@/types/patient.types'
import type { Clientes } from '@/types/database.types'

interface PatientFormModalProps {
  isOpen: boolean
  patient?: MascotaConCliente | null
  tenantId: number
  onClose: () => void
  onSuccess: () => void
}

export function PatientFormModal({
  isOpen,
  patient,
  tenantId,
  onClose,
  onSuccess,
}: PatientFormModalProps) {
  const { hasPermission } = usePermissions()
  const isEditing = !!patient

  // Form State
  const [nombre, setNombre] = useState('')
  const [especie, setEspecie] = useState<PetSpeciesType | string>('Perros')
  const [otraEspecie, setOtraEspecie] = useState('')
  const [raza, setRaza] = useState('')
  const [sexo, setSexo] = useState<'MACHO' | 'HEMBRA'>('MACHO')
  const [edad, setEdad] = useState('')
  const [edadMeses, setEdadMeses] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [peso, setPeso] = useState('')
  const [alertas, setAlertas] = useState('')
  const [estado, setEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO')

  // Propietario selector
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [clients, setClients] = useState<Clientes[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [isLoadingClients, setIsLoadingClients] = useState(false)

  // Fotografía & optimización
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalSize: number
    optimizedSize: number
    savedPercentage: number
  } | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar clientes de la veterinaria para el selector
  useEffect(() => {
    if (!isOpen) return

    const fetchClients = async () => {
      try {
        setIsLoadingClients(true)
        const data = await clientsService.getClients(tenantId)
        setClients(data)
      } catch (err) {
        console.error('Error al cargar lista de clientes para selector:', err)
      } finally {
        setIsLoadingClients(false)
      }
    }

    fetchClients()
  }, [isOpen, tenantId])

  // Inicializar formulario al abrir o cambiar de paciente
  useEffect(() => {
    if (!isOpen) return

    if (patient) {
      setNombre(patient.nombre || '')
      const isKnownSpecies = PET_SPECIES.includes(patient.especie as any)
      if (isKnownSpecies) {
        setEspecie(patient.especie)
        setOtraEspecie('')
      } else {
        setEspecie('Otros')
        setOtraEspecie(patient.especie || '')
      }
      setRaza(patient.raza || '')
      setSexo((patient.sexo?.toUpperCase() === 'HEMBRA' ? 'HEMBRA' : 'MACHO'))
      setEdad(patient.edad !== null && patient.edad !== undefined ? String(patient.edad) : '')
      setEdadMeses(patient.edad_meses !== null && patient.edad_meses !== undefined ? String(patient.edad_meses) : '')
      setFechaNac(patient.fecha_nac ? patient.fecha_nac.split('T')[0] : '')
      setPeso(patient.peso !== null && patient.peso !== undefined ? String(patient.peso) : '')
      setAlertas(patient.alertas || '')
      setEstado(patient.estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO')
      setSelectedClientId(patient.id_cliente || null)
      setPhotoPreview(patient.foto_url || null)
      setPhotoFile(null)
      setIsPhotoRemoved(false)
      setOptimizationInfo(null)
    } else {
      // Modo Nuevo
      setNombre('')
      setEspecie('Perros')
      setOtraEspecie('')
      setRaza('Mestizo/Criollo')
      setSexo('MACHO')
      setEdad('')
      setEdadMeses('')
      setFechaNac('')
      setPeso('')
      setAlertas('')
      setEstado('ACTIVO')
      setSelectedClientId(null)
      setPhotoPreview(null)
      setPhotoFile(null)
      setIsPhotoRemoved(false)
      setOptimizationInfo(null)
      setClientSearch('')
    }
  }, [isOpen, patient])

  if (!isOpen) return null

  // Manejo de optimización de fotos
  const handlePhotoSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.warning('Por favor selecciona una imagen válida (PNG, JPG o WEBP).')
      return
    }

    try {
      setIsOptimizing(true)
      const optimized = await optimizeImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
        format: 'image/webp',
      })

      setPhotoFile(optimized.file)
      setPhotoPreview(optimized.previewUrl)
      setIsPhotoRemoved(false)
      setOptimizationInfo({
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize,
        savedPercentage: optimized.savedPercentage,
      })
      toast.success(
        `Foto optimizada a WebP (${formatBytes(optimized.optimizedSize)} — ahorro del ${optimized.savedPercentage}%).`,
        'Imagen Lista'
      )
    } catch (err: any) {
      console.error(err)
      toast.error('Error al optimizar imagen. Se usará el archivo original.')
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
      setIsPhotoRemoved(false)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setPhotoFile(null)
    setIsPhotoRemoved(true)
    setOptimizationInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Filtrado de clientes para selector
  const filteredClients = clients.filter((c) => {
    const full = `${c.nombres || ''} ${c.apellidos || ''} ${c.telefono || ''} ${c.numero_ci || ''}`.toLowerCase()
    return full.includes(clientSearch.toLowerCase())
  })

  // Sugerencias de razas según especie
  const breedOptions =
    especie === 'Perros' ? DOG_BREEDS : especie === 'Gatos' ? CAT_BREEDS : []

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && !hasPermission('EDITAR_MASCOTAS')) {
      toast.error('No tienes permisos para modificar información de pacientes.')
      return
    }
    if (!isEditing && !hasPermission('CREAR_MASCOTAS')) {
      toast.error('No tienes permisos para dar de alta nuevos pacientes.')
      return
    }

    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre de la mascota.')
      return
    }

    const especieFinal = especie === 'Otros' ? otraEspecie.trim() : especie
    if (!especieFinal) {
      toast.warning('Por favor especifica la especie de la mascota.')
      return
    }

    if (!isEditing && !selectedClientId) {
      toast.warning('Por favor selecciona el propietario o tutor de la mascota.')
      return
    }

    try {
      setIsSaving(true)

      let fotoUrlFinal: string | null = patient?.foto_url || null

      // 1. Si hay nueva foto optimizada, subir a Supabase Storage
      if (photoFile) {
        fotoUrlFinal = await storageService.uploadPatientPhoto(
          photoFile,
          tenantId,
          patient?.id_mascota
        )
      } else if (isPhotoRemoved && patient?.foto_url) {
        await storageService.deletePatientPhoto(patient.foto_url)
        fotoUrlFinal = null
      }

      const payload = {
        id_veterinaria: tenantId,
        id_cliente: selectedClientId || patient?.id_cliente!,
        nombre: nombre.trim().toUpperCase(),
        especie: especieFinal,
        raza: raza.trim() || null,
        sexo,
        edad: edad ? parseInt(edad) : null,
        edad_meses: edadMeses ? parseInt(edadMeses) : null,
        fecha_nac: fechaNac ? new Date(fechaNac).toISOString() : null,
        peso: peso ? parseFloat(peso) : null,
        foto_url: fotoUrlFinal,
        alertas: alertas.trim() || null,
        estado,
      }

      if (isEditing && patient) {
        await patientsService.updatePatient(patient.id_mascota, payload)
        toast.success(`Datos de ${nombre} actualizados con éxito.`, 'Paciente Actualizado')
      } else {
        await patientsService.createPatient(payload)
        toast.success(`Paciente ${nombre} registrado exitosamente.`, 'Mascota Registrada')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error al guardar paciente:', err)
      toast.error(err.message || 'No se pudo guardar la información de la mascota.', 'Error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/40 flex items-center justify-center shrink-0">
              <Dog className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? `Editar Paciente: ${patient.nombre}` : 'Registrar Nueva Mascota'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Modifica los datos clínicos y biométricos de la mascota'
                  : 'Asocia una nueva mascota a un tutor de la veterinaria'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Selector de Tutor / Propietario */}
          {!isEditing ? (
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Propietario / Tutor <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Buscar tutor por nombre, teléfono o CI..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Lista filtrada de tutores */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 mt-2 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 bg-white dark:bg-slate-900">
                {isLoadingClients ? (
                  <p className="text-xs text-slate-400 p-2 text-center">Cargando tutores...</p>
                ) : filteredClients.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2 text-center italic">
                    No se encontraron tutores coincidentes.
                  </p>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = selectedClientId === client.id_cliente
                    return (
                      <button
                        type="button"
                        key={client.id_cliente}
                        onClick={() => setSelectedClientId(client.id_cliente)}
                        className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors text-xs ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-800 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={client.foto_url || undefined}
                            fallback={client.nombres}
                            className="w-6 h-6 text-[10px]"
                          />
                          <span>
                            {client.nombres} {client.apellidos}
                          </span>
                          {client.telefono && (
                            <span className="text-slate-400 font-mono text-[11px]">
                              • {client.telefono}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 dark:text-slate-500 block">Tutor Asignado</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {patient?.cliente
                    ? `${patient.cliente.nombres} ${patient.cliente.apellidos}`
                    : 'Sin tutor asignado'}
                </span>
              </div>
            </div>
          )}

          {/* Fotografía de la Mascota */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Fotografía del Paciente</label>
            <div className="flex items-center gap-4">
              <Avatar
                src={photoPreview || undefined}
                fallback={nombre || 'PET'}
                className="w-16 h-16 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800 object-cover shadow-sm shrink-0"
              />

              <div className="flex-1 space-y-1.5">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (e.dataTransfer.files?.[0]) {
                      handlePhotoSelected(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Arrastra una foto o haz clic para seleccionarla</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handlePhotoSelected(e.target.files[0])
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  {optimizationInfo && (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Ahorro del {optimizationInfo.savedPercentage}% (WebP)
                    </span>
                  )}
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Quitar foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Campos Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Nombre de la Mascota <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Ej. CANITO, LUNA, FIRULAIS"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="text-xs uppercase font-medium"
                required
              />
            </div>

            {/* Especie */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Especie <span className="text-rose-500">*</span>
              </label>
              <select
                value={especie}
                onChange={(e) => setEspecie(e.target.value as PetSpeciesType)}
                className="w-full h-9 text-xs px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PET_SPECIES.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            {/* Otra Especie si selecciona 'Otros' */}
            {especie === 'Otros' && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Especifica la Especie <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Ej. Erizo, Chinchilla, Serpiente..."
                  value={otraEspecie}
                  onChange={(e) => setOtraEspecie(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}

            {/* Raza */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Raza</label>
              <div className="relative">
                <Input
                  placeholder="Ej. Pastor Alemán, Siamés, Mestizo..."
                  value={raza}
                  onChange={(e) => setRaza(e.target.value)}
                  className="text-xs"
                  list="breeds-list"
                />
                <datalist id="breeds-list">
                  {breedOptions.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Sexo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Sexo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSexo('MACHO')}
                  className={`h-9 rounded-lg border text-xs font-semibold transition-colors ${
                    sexo === 'MACHO'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Macho
                </button>
                <button
                  type="button"
                  onClick={() => setSexo('HEMBRA')}
                  className={`h-9 rounded-lg border text-xs font-semibold transition-colors ${
                    sexo === 'HEMBRA'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Hembra
                </button>
              </div>
            </div>

            {/* Edad en Años y Meses */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Edad Estimada</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="40"
                    placeholder="Años"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    className="text-xs pr-8"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 pointer-events-none">
                    años
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="11"
                    placeholder="Meses"
                    value={edadMeses}
                    onChange={(e) => setEdadMeses(e.target.value)}
                    className="text-xs pr-8"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 pointer-events-none">
                    meses
                  </span>
                </div>
              </div>
            </div>

            {/* Peso */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Peso Actual (kg)</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej. 5.3"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="text-xs pr-8"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Fecha de Nacimiento</label>
              <Input
                type="date"
                value={fechaNac}
                onChange={(e) => setFechaNac(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Estado del Paciente</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as 'ACTIVO' | 'INACTIVO')}
                className="w-full h-9 text-xs px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVO">ACTIVO (En atención)</option>
                <option value="INACTIVO">INACTIVO (Baja temporal / Archivo)</option>
              </select>
            </div>
          </div>

          {/* Alertas Médicas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
              Alertas Clínicas o Alergias Importantes
            </label>
            <Input
              placeholder="Ej. Alérgico a penicilina, agresivo con desconocidos, etc."
              value={alertas}
              onChange={(e) => setAlertas(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || isOptimizing}
              className="text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Registrar Mascota'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
