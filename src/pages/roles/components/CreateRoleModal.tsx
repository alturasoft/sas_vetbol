import { useState, useEffect } from 'react'
import { ShieldPlus, X, AlertCircle, Loader2, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RolesService } from '@/services/roles.service'
import { toast } from '@/stores/useToastStore'
import type { RolRBAC } from '@/types/staff.types'

interface CreateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (newRol: RolRBAC, configureNow: boolean) => void
  clinicId: number
}

/**
 * Modal para crear un Rol Personalizado por clínica (Sección 2.2 Regla 3: RolesScreen._showCreateRoleDialog)
 * Todo rol nuevo se normaliza a mayúsculas, nace con activo: true, es_sistema: false y lista de permisos vacía [].
 */
export function CreateRoleModal({
  isOpen,
  onClose,
  onCreated,
  clinicId,
}: CreateRoleModalProps) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [configureNow, setConfigureNow] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNombre('')
      setDescripcion('')
      setConfigureNow(true)
      setErrorMessage(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const normalizedPreview = nombre.trim().toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!normalizedPreview) {
      setErrorMessage('Ingresa un nombre válido para el rol.')
      return
    }

    if (normalizedPreview.length < 3) {
      setErrorMessage('El nombre del rol debe tener al menos 3 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await RolesService.createRol(
        {
          id_veterinaria: clinicId,
          nombre: normalizedPreview,
          descripcion: descripcion.trim() || null,
        },
        []
      )

      toast.success(
        'Rol Creado',
        `El rol personalizado "${created.nombre}" fue creado correctamente.`
      )
      onCreated(created, configureNow)
      onClose()
    } catch (err: any) {
      console.error('Error al crear rol personalizado:', err)
      setErrorMessage(err?.message || 'No se pudo crear el rol personalizado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
              <ShieldPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Nuevo Rol Personalizado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define un perfil de acceso a medida para tu clínica
              </p>
            </div>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nombre del Rol <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value.toUpperCase())}
                placeholder="Ej. CIRUJANO_JEFE, LABORATORIO, CAJA..."
                className="pl-9 text-xs font-semibold uppercase tracking-wide dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                maxLength={50}
                autoFocus
                required
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Se normaliza automáticamente a mayúsculas</span>
              {normalizedPreview && (
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                  {normalizedPreview}
                </code>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Descripción Operativa
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe las responsabilidades o alcance de este rol en la clínica..."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 cursor-pointer">
            <input
              type="checkbox"
              checked={configureNow}
              onChange={(e) => setConfigureNow(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="text-xs">
              <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Configurar matriz de permisos al finalizar
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                El rol nace activo y sin permisos iniciales. Te llevaremos directo al panel de permisos para habilitarlos.
              </p>
            </div>
          </label>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs dark:border-slate-800 dark:text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !normalizedPreview}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando rol...
                </>
              ) : (
                <>
                  <ShieldPlus className="w-4 h-4" />
                  Crear Rol
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

