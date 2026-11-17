import { useRef } from 'react'
import { Camera, Sparkles, Trash2, MapPin, User, Phone, Mail, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BOLIVIAN_DEPARTMENTS } from '@/constants/petCatalogs'
import { optimizeImage, formatBytes } from '@/lib/imageOptimization'
import { cn } from '@/lib/utils'
import { toast } from '@/stores/useToastStore'

export interface ClientFormData {
  nombres: string
  apellidos: string
  numero_ci: string
  telefono: string
  email: string
  depto: number
  fotoFile: File | null
  photoPreview: string | null
  isPhotoRemoved: boolean
  optimizationInfo: {
    originalSize: number
    optimizedSize: number
    savedPercentage: number
  } | null
}

interface StepClientFormProps {
  formData: ClientFormData
  onChange: (data: Partial<ClientFormData>) => void
  disabled?: boolean
}

export function StepClientForm({ formData, onChange, disabled = false }: StepClientFormProps) {
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
      toast.info(`Foto optimizada: ${formatBytes(result.originalSize)} ➔ ${formatBytes(result.optimizedSize)} (-${result.savedPercentage}%)`)
    } catch (err: any) {
      console.error('Error al optimizar imagen:', err)
      toast.error('No se pudo optimizar la imagen seleccionada.')
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

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
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

      {/* Profile Photo Section */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
        {formData.photoPreview ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/30 ring-4 ring-emerald-50 bg-white shadow-xs">
                <img
                  src={formData.photoPreview}
                  alt="Foto del propietario"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white cursor-pointer"
                title="Cambiar fotografía"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Fotografía del Propietario
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
                  ? `Optimizado: -${formData.optimizationInfo.savedPercentage}% de peso sin pérdida de resolución.`
                  : 'Fotografía para identificar al cliente en fichas, historias y citas.'}
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
              Subir fotografía del propietario
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              PNG, JPG o WEBP (Compresión automática a WebP)
            </span>
          </div>
        )}
      </div>

      {/* Row 1: Nombres y Apellidos en MAYÚSCULAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Nombres *
          </label>
          <Input
            type="text"
            required
            placeholder="EJ: MARCELO ANDRÉS"
            value={formData.nombres}
            onChange={(e) => onChange({ nombres: e.target.value.toUpperCase() })}
            disabled={disabled}
            className="text-xs uppercase font-medium"
          />
          <span className="text-[10px] text-slate-400">
            Formato automático en MAYÚSCULAS
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Apellidos *
          </label>
          <Input
            type="text"
            required
            placeholder="EJ: CLAURE PAZ"
            value={formData.apellidos}
            onChange={(e) => onChange({ apellidos: e.target.value.toUpperCase() })}
            disabled={disabled}
            className="text-xs uppercase font-medium"
          />
          <span className="text-[10px] text-slate-400">
            Formato automático en MAYÚSCULAS
          </span>
        </div>
      </div>

      {/* Row 2: Departamento y CI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Departamento (Bolivia) *
          </label>
          <select
            value={formData.depto}
            onChange={(e) => onChange({ depto: Number(e.target.value) })}
            disabled={disabled}
            className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {BOLIVIAN_DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.id}. {dept.nombre}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400">
            Jurisdicción departamental del cliente
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            Cédula de Identidad (CI)
          </label>
          <Input
            type="text"
            placeholder="Ej: 6789123 LP"
            value={formData.numero_ci}
            onChange={(e) => onChange({ numero_ci: e.target.value })}
            disabled={disabled}
            className="text-xs"
          />
          <span className="text-[10px] text-slate-400">
            Credencial de acceso en la app móvil del cliente
          </span>
        </div>
      </div>

      {/* Row 3: Teléfono y Correo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            Teléfono / WhatsApp *
          </label>
          <Input
            type="text"
            required
            placeholder="Ej: 71098234"
            value={formData.telefono}
            onChange={(e) => onChange({ telefono: e.target.value })}
            disabled={disabled}
            className="text-xs font-medium"
          />
          <span className="text-[10px] text-slate-400">
            Canal principal de contacto y recordatorios
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            Correo Electrónico
          </label>
          <Input
            type="email"
            placeholder="propietario@email.com"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
            disabled={disabled}
            className="text-xs"
          />
          <span className="text-[10px] text-slate-400">
            Único por clínica. Utilizado para login móvil
          </span>
        </div>
      </div>
    </div>
  )
}
