import { useState, useEffect, useRef } from 'react'
import {
  X,
  Mail,
  User,
  Phone,
  Shield,
  Camera,
  Sparkles,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StaffService } from '@/services/staff.service'
import { optimizeImage, formatBytes } from '@/lib/imageOptimization'
import { toast } from '@/stores/useToastStore'
import type { PersonaStaff, UpdateStaffDTO, RolRBAC } from '@/types/staff.types'

interface StaffEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staff: PersonaStaff | null
  clinicId: number
}

export function StaffEditModal({
  isOpen,
  onClose,
  onSuccess,
  staff,
  clinicId,
}: StaffEditModalProps) {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [rol, setRol] = useState<'MED' | 'ADM'>('MED')
  const [selectedRolId, setSelectedRolId] = useState<number | undefined>(undefined)

  // Estados de Imagen
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalSize: number
    optimizedSize: number
    savedPercentage: number
  } | null>(null)

  const [rolesList, setRolesList] = useState<RolRBAC[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && staff) {
      setNombres(staff.nombres || '')
      setApellidos(staff.apellidos || '')
      setEmail(staff.email || '')
      setTelefono(staff.telefono || '')
      setRol(staff.rol === 'MED' ? 'MED' : 'ADM')
      setSelectedRolId(staff.rol_info?.id_rol)
      setPhotoPreview(staff.foto_url || null)
      setPhotoFile(null)
      setOptimizationInfo(null)
      setErrorMessage(null)
      loadClinicRoles()
    }
  }, [isOpen, staff])

  const loadClinicRoles = async () => {
    try {
      const roles = await StaffService.getRolesByClinic(clinicId)
      setRolesList(roles)
    } catch (err) {
      console.warn('Error al cargar roles en modal de edición:', err)
    }
  }

  const handleSelectRbacRole = (idRolStr: string) => {
    if (!idRolStr) {
      setSelectedRolId(undefined)
      return
    }
    const idRol = Number(idRolStr)
    setSelectedRolId(idRol)
    const found = rolesList.find((r) => r.id_rol === idRol)
    if (found) {
      // Sincronización automática personal.rol <-> rol RBAC (Sección 1.1 y 4.3)
      setRol(found.nombre.trim().toUpperCase() === 'VETERINARIO' ? 'MED' : 'ADM')
    }
  }

  if (!isOpen || !staff) return null

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Archivo no soportado', 'Por favor selecciona un archivo de imagen válido.')
      return
    }

    try {
      setIsOptimizing(true)
      const res = await optimizeImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.82,
        format: 'image/webp',
      })

      setPhotoFile(res.file)
      setPhotoPreview(res.previewUrl)
      setOptimizationInfo({
        originalSize: res.originalSize,
        optimizedSize: res.optimizedSize,
        savedPercentage: res.savedPercentage,
      })
    } catch (err) {
      console.error('Error al optimizar avatar:', err)
      toast.error('Error de Imagen', 'No se pudo procesar la fotografía.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!nombres.trim() || !apellidos.trim()) {
      setErrorMessage('Nombres y apellidos son requeridos.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload: UpdateStaffDTO = {
        id_persona: staff.id_persona,
        id_veterinaria: clinicId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim() || undefined,
        rol,
        id_rol: selectedRolId,
        foto_file: photoFile || undefined,
      }

      await StaffService.updateStaff(payload)
      toast.success(
        'Perfil Actualizado',
        `Los datos de ${payload.nombres} ${payload.apellidos} han sido guardados correctamente.`
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error al actualizar staff:', err)
      setErrorMessage(err.message || 'Error al actualizar datos del personal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Editar Perfil de Personal</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modifica los datos operativos, imagen de perfil o rol de acceso
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sección de Fotografía con Compresión WebP */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <div className="relative group shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={nombres}
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold text-lg border-2 border-emerald-200 dark:border-emerald-800">
                  {(nombres[0] || 'S') + (apellidos[0] || 'V')}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isOptimizing}
                title="Cambiar fotografía"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Foto de Perfil</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                >
                  Subir nueva
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Se optimizará a WebP de alta fidelidad antes de subir al almacenamiento.
              </p>

              {optimizationInfo && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>
                    Comprimido {optimizationInfo.savedPercentage}% (
                    {formatBytes(optimizationInfo.originalSize)} → {formatBytes(optimizationInfo.optimizedSize)})
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Selector de Rol Base */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Función Operativa <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRol('MED')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  rol === 'MED'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                Médico Veterinario
              </button>
              <button
                type="button"
                onClick={() => setRol('ADM')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  rol === 'ADM'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                Administrativo
              </button>
            </div>
          </div>

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Nombres <span className="text-rose-500">*</span>
              </label>
              <Input
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                className="text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Apellidos <span className="text-rose-500">*</span>
              </label>
              <Input
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="text-xs"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Correo Electrónico <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-xs"
                required
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Teléfono / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+591 ..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Selector de Rol Granular RBAC */}
          {rolesList.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Rol de Acceso y Permisos (RBAC)
              </label>
              <select
                value={selectedRolId ?? ''}
                onChange={(e) => handleSelectRbacRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Predeterminado según función</option>
                {rolesList.map((r) => (
                  <option key={r.id_rol} value={r.id_rol}>
                    {r.nombre} {r.descripcion ? `— ${r.descripcion}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Seleccionar VETERINARIO sincroniza función médica (MED); cualquier otro rol sincroniza función administrativa (ADM).
              </p>
            </div>
          )}

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
