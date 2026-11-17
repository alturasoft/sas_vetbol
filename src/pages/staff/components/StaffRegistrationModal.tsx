import { useState, useEffect } from 'react'
import {
  UserPlus,
  X,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Stethoscope,
  Briefcase,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StaffService } from '@/services/staff.service'
import { toast } from '@/stores/useToastStore'
import type { RegisterStaffDTO, RolRBAC } from '@/types/staff.types'

interface StaffRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clinicId: number
}

export function StaffRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  clinicId,
}: StaffRegistrationModalProps) {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [telefono, setTelefono] = useState('')
  const [rol, setRol] = useState<'MED' | 'ADM'>('MED')
  const [selectedRolId, setSelectedRolId] = useState<number | undefined>(undefined)

  const [rolesList, setRolesList] = useState<RolRBAC[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && clinicId) {
      loadClinicRoles()
      resetForm()
    }
  }, [isOpen, clinicId])

  const loadClinicRoles = async () => {
    setIsLoadingRoles(true)
    try {
      const roles = await StaffService.getRolesByClinic(clinicId)
      setRolesList(roles)
      const vetRole = roles.find((r) => r.nombre.trim().toUpperCase() === 'VETERINARIO')
      if (vetRole) {
        setSelectedRolId(vetRole.id_rol)
      }
    } catch (err) {
      console.warn('No se pudieron cargar los roles:', err)
    } finally {
      setIsLoadingRoles(false)
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

  const resetForm = () => {
    setNombres('')
    setApellidos('')
    setEmail('')
    setPassword('')
    setTelefono('')
    setRol('MED')
    setSelectedRolId(undefined)
    setShowPassword(false)
    setErrorMessage(null)
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!nombres.trim() || !apellidos.trim()) {
      setErrorMessage('Por favor ingresa nombres y apellidos completos.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload: RegisterStaffDTO = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim().toLowerCase(),
        password,
        telefono: telefono.trim() || undefined,
        rol,
        id_rol: selectedRolId,
      }

      await StaffService.registerStaff(payload)
      toast.success(
        'Miembro Registrado',
        `Se creó la cuenta para ${payload.nombres} ${payload.apellidos} con acceso activo.`
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error registrando staff:', err)
      setErrorMessage(err.message || 'Error inesperado al crear el personal.')
    } finally {
      setIsSubmitting(false)
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
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Alta de Personal</h2>
              <p className="text-xs text-slate-500">
                Registra un colaborador y genera sus credenciales de acceso al sistema
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selector de Rol Base de Sistema */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tipo de Función Operativa <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRol('MED')
                  const vetRole = rolesList.find((r) => r.nombre.trim().toUpperCase() === 'VETERINARIO')
                  if (vetRole) setSelectedRolId(vetRole.id_rol)
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  rol === 'MED'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    rol === 'MED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Médico Veterinario</div>
                  <div className="text-[10px] text-slate-500 leading-tight">Turnos y consultas</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRol('ADM')
                  const currentRbac = rolesList.find((r) => r.id_rol === selectedRolId)
                  if (currentRbac?.nombre.trim().toUpperCase() === 'VETERINARIO') {
                    const recRole = rolesList.find((r) => r.nombre.trim().toUpperCase() === 'RECEPCION')
                    setSelectedRolId(recRole?.id_rol)
                  }
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  rol === 'ADM'
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    rol === 'ADM' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Administrativo</div>
                  <div className="text-[10px] text-slate-500 leading-tight">Recepción / Gestión</div>
                </div>
              </button>
            </div>
          </div>

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Nombres <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. Carlos Andrés"
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Apellidos <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Morales Vargas"
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email de Acceso */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Correo Electrónico (Acceso al SaaS) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@veterinaria.com"
                className="pl-9 text-xs"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Será utilizado por el colaborador como credencial de inicio de sesión.
            </p>
          </div>

          {/* Contraseña Inicial */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Contraseña Inicial <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pl-9 pr-10 text-xs"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Teléfono de Contacto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Teléfono / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. +591 70012345"
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Selector de Rol Granular RBAC */}
          {rolesList.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Rol de Acceso y Permisos (RBAC)
              </label>
              <select
                value={selectedRolId ?? ''}
                onChange={(e) => handleSelectRbacRole(e.target.value)}
                disabled={isLoadingRoles}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Predeterminado según función base</option>
                {rolesList.map((r) => (
                  <option key={r.id_rol} value={r.id_rol}>
                    {r.nombre} {r.descripcion ? `— ${r.descripcion}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Si seleccionas VETERINARIO se asigna función médica (MED); cualquier otro rol sincroniza función administrativa (ADM).
              </p>
            </div>
          )}

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Registrar Personal
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
