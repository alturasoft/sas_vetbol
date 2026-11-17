import { useRef } from 'react'
import { Camera, Sparkles, Trash2, PawPrint, Calendar, Scale, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DynamicVaccinesList } from './DynamicVaccinesList'
import {
  PET_SPECIES,
  DOG_BREEDS,
  CAT_BREEDS,
  type PetSpeciesType,
} from '@/constants/petCatalogs'
import { optimizeImage, formatBytes } from '@/lib/imageOptimization'
import { cn } from '@/lib/utils'
import { toast } from '@/stores/useToastStore'
import type { VaccineDraft } from '@/services/vaccines.service'

export interface PatientFormData {
  nombre: string
  especie: PetSpeciesType | string
  otraEspecie: string
  raza: string
  sexo: 'MACHO' | 'HEMBRA'
  edad: string
  edad_meses: string
  fecha_nac: string
  peso: string
  fotoFile: File | null
  photoPreview: string | null
  isPhotoRemoved: boolean
  optimizationInfo: {
    originalSize: number
    optimizedSize: number
    savedPercentage: number
  } | null
  vacunas: VaccineDraft[]
}

interface StepPatientFormProps {
  formData: PatientFormData
  onChange: (data: Partial<PatientFormData>) => void
  clientName: string
  clientId?: number
  disabled?: boolean
}

export function StepPatientForm({
  formData,
  onChange,
  clientName,
  clientId,
  disabled = false,
}: StepPatientFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.warning('Por favor selecciona un archivo de imagen (PNG, JPG o WEBP).')
      return
    }

    try {
      const result = await optimizeImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.82,
      })

      onChange({
        fotoFile: result.file,
        photoPreview: result.previewUrl,
        isPhotoRemoved: false,
        optimizationInfo: {
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          savedPercentage: result.savedPercentage,
        },
      })
      toast.info(
        `Foto de mascota optimizada: ${formatBytes(result.originalSize)} ➔ ${formatBytes(result.optimizedSize)} (-${result.savedPercentage}%)`
      )
    } catch (err: any) {
      console.error('Error al optimizar foto de mascota:', err)
      toast.error('No se pudo optimizar la imagen de la mascota.')
    }
  }

  const handleRemovePhoto = () => {
    onChange({
      fotoFile: null,
      photoPreview: null,
      isPhotoRemoved: true,
      optimizationInfo: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Prevenir fechas futuras
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Banner de Propietario Vinculado */}
      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
              Propietario Asociado
            </span>
            <p className="text-sm font-bold text-slate-900">
              {clientName} {clientId ? `(#${clientId})` : ''}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Cliente Registrado
        </span>
      </div>

      {/* Selector de Foto de Mascota */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handlePhotoSelected(file)
        }}
      />

      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
        {formData.photoPreview ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/30 ring-4 ring-emerald-50 bg-white shadow-xs">
                <img
                  src={formData.photoPreview}
                  alt="Foto del paciente"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="absolute inset-0 rounded-2xl bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white cursor-pointer"
                title="Cambiar fotografía"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Fotografía de Identificación del Paciente
                </span>
                {formData.optimizationInfo && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    WebP ({formatBytes(formData.optimizationInfo.optimizedSize)})
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                {formData.optimizationInfo
                  ? `Optimizado: -${formData.optimizationInfo.savedPercentage}% de peso. Guardado en bucket mascotas-fotos.`
                  : 'Fotografía para la ficha médica, citas y carnet digital.'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="text-xs h-7 gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  Cambiar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={disabled}
                  className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all text-center group cursor-pointer border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
              Subir fotografía del paciente (mascota)
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Opcional. Compresión automática a WebP para bucket mascotas-fotos
            </span>
          </div>
        )}
      </div>

      {/* Row 1: Nombre de Mascota y Sexo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
            Nombre del Paciente *
          </label>
          <Input
            type="text"
            required
            placeholder="Ej: Bobby, Luna, Rocky"
            value={formData.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            disabled={disabled}
            className="text-xs font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Sexo del Paciente *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ sexo: 'MACHO' })}
              disabled={disabled}
              className={cn(
                'h-9 rounded-md border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
                formData.sexo === 'MACHO'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="text-sm">♂</span> MACHO
            </button>
            <button
              type="button"
              onClick={() => onChange({ sexo: 'HEMBRA' })}
              disabled={disabled}
              className={cn(
                'h-9 rounded-md border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
                formData.sexo === 'HEMBRA'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="text-sm">♀</span> HEMBRA
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Especie y Raza Condicional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Especie *
          </label>
          <select
            value={formData.especie}
            onChange={(e) => {
              const newSpecies = e.target.value as PetSpeciesType
              onChange({
                especie: newSpecies,
                raza: newSpecies === 'Perros' ? DOG_BREEDS[0] : newSpecies === 'Gatos' ? CAT_BREEDS[0] : '',
                otraEspecie: newSpecies === 'Otros' ? formData.otraEspecie : '',
              })
            }}
            disabled={disabled}
            className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {PET_SPECIES.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>

        {/* Raza o Especificación según Especie */}
        {formData.especie === 'Otros' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Especificar Especie *
            </label>
            <Input
              type="text"
              required
              placeholder="Ej: Erizo de tierra, Chinchilla"
              value={formData.otraEspecie}
              onChange={(e) => onChange({ otraEspecie: e.target.value })}
              disabled={disabled}
              className="text-xs"
            />
          </div>
        ) : formData.especie === 'Perros' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Raza (Catálogo Canino)
            </label>
            <select
              value={formData.raza}
              onChange={(e) => onChange({ raza: e.target.value })}
              disabled={disabled}
              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {DOG_BREEDS.map((breed) => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </select>
          </div>
        ) : formData.especie === 'Gatos' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Raza (Catálogo Felino)
            </label>
            <select
              value={formData.raza}
              onChange={(e) => onChange({ raza: e.target.value })}
              disabled={disabled}
              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {CAT_BREEDS.map((breed) => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Raza / Variedad (Opcional)
            </label>
            <Input
              type="text"
              placeholder="Ej: Holandés enano, Ninfa"
              value={formData.raza}
              onChange={(e) => onChange({ raza: e.target.value })}
              disabled={disabled}
              className="text-xs"
            />
          </div>
        )}
      </div>

      {/* Row 3: Edad (Años, Meses), Fecha de Nacimiento y Peso */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Edad (Años)
          </label>
          <Input
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={formData.edad}
            onChange={(e) => onChange({ edad: e.target.value })}
            disabled={disabled}
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Meses (Adic.)
          </label>
          <Input
            type="number"
            min="0"
            max="11"
            step="1"
            placeholder="0"
            value={formData.edad_meses}
            onChange={(e) => onChange({ edad_meses: e.target.value })}
            disabled={disabled}
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Fecha Nac.
          </label>
          <Input
            type="date"
            max={today}
            value={formData.fecha_nac}
            onChange={(e) => onChange({ fecha_nac: e.target.value })}
            disabled={disabled}
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Scale className="w-3 h-3 text-slate-400" />
            Peso (kg)
          </label>
          <Input
            type="number"
            min="0"
            step="0.05"
            placeholder="Ej: 4.5"
            value={formData.peso}
            onChange={(e) => onChange({ peso: e.target.value })}
            disabled={disabled}
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Subsección Dinámica de Vacunas */}
      <div className="pt-2 border-t border-slate-100">
        <DynamicVaccinesList
          vaccines={formData.vacunas}
          onChange={(vacunas) => onChange({ vacunas })}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
