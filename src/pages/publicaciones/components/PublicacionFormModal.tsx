import { useState, useEffect, useRef } from 'react'
import type {
  Publicacion,
  PublicacionFormData,
  TipoPublicacion,
  TipoBotonAccion,
} from '@/types/publicacion'
import { TIPO_PUBLICACION_CONFIG } from './PublicacionBadge'
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Trash2,
  PhoneCall,
  Globe,
  HelpCircle,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PublicacionFormModalProps {
  isOpen: boolean
  publicacionToEdit?: Publicacion | null
  isSaving: boolean
  onClose: () => void
  onSave: (data: PublicacionFormData, imageFile?: File | null) => Promise<void>
}

const DEFAULT_FORM_DATA: PublicacionFormData = {
  tipo: 'CONSEJO',
  titulo: '',
  resumen: '',
  contenido: '',
  imagen_url: null,
  botonTipo: 'NONE',
  boton_texto: '',
  boton_accion: '',
  fecha_inicio: null,
  fecha_fin: null,
  activo: true,
}

export function PublicacionFormModal({
  isOpen,
  publicacionToEdit,
  isSaving,
  onClose,
  onSave,
}: PublicacionFormModalProps) {
  const [formData, setFormData] = useState<PublicacionFormData>(DEFAULT_FORM_DATA)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (publicacionToEdit) {
      let botonTipo: TipoBotonAccion = 'NONE'
      if (publicacionToEdit.boton_texto || publicacionToEdit.boton_accion) {
        if (
          publicacionToEdit.boton_texto?.toLowerCase().includes('llamar') ||
          /^\+?[0-9\s]+$/.test(publicacionToEdit.boton_accion || '')
        ) {
          botonTipo = 'WHATSAPP'
        } else {
          botonTipo = 'WEB'
        }
      }

      setFormData({
        tipo: publicacionToEdit.tipo || 'CONSEJO',
        titulo: publicacionToEdit.titulo || '',
        resumen: publicacionToEdit.resumen || '',
        contenido: publicacionToEdit.contenido || '',
        imagen_url: publicacionToEdit.imagen_url || null,
        botonTipo,
        boton_texto: publicacionToEdit.boton_texto || '',
        boton_accion: publicacionToEdit.boton_accion || '',
        fecha_inicio: publicacionToEdit.fecha_inicio
          ? new Date(publicacionToEdit.fecha_inicio).toISOString().slice(0, 16)
          : null,
        fecha_fin: publicacionToEdit.fecha_fin
          ? new Date(publicacionToEdit.fecha_fin).toISOString().slice(0, 16)
          : null,
        activo: publicacionToEdit.activo ?? true,
      })
      setImagePreviewUrl(publicacionToEdit.imagen_url || null)
      setImageFile(null)
    } else {
      setFormData(DEFAULT_FORM_DATA)
      setImagePreviewUrl(null)
      setImageFile(null)
    }
    setErrors({})
  }, [publicacionToEdit, isOpen])

  if (!isOpen) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, imagen: 'El archivo seleccionado debe ser una imagen' }))
      return
    }

    setImageFile(file)
    const preview = URL.createObjectURL(file)
    setImagePreviewUrl(preview)
    setFormData((prev) => ({ ...prev, imagen_url: preview }))
    setErrors((prev) => {
      const copy = { ...prev }
      delete copy.imagen
      return copy
    })
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreviewUrl(null)
    setFormData((prev) => ({ ...prev, imagen_url: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleBotonTipoChange = (newTipo: TipoBotonAccion) => {
    setFormData((prev) => ({
      ...prev,
      botonTipo: newTipo,
      boton_texto:
        newTipo === 'WHATSAPP'
          ? prev.boton_texto || 'Llamar a la clínica'
          : newTipo === 'WEB'
          ? prev.boton_texto || 'Más información'
          : '',
      boton_accion:
        newTipo === 'NONE'
          ? ''
          : prev.boton_accion,
    }))
    setErrors((prev) => {
      const copy = { ...prev }
      delete copy.boton_accion
      return copy
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio'
    } else if (formData.titulo.trim().length > 200) {
      newErrors.titulo = 'El título no puede exceder 200 caracteres'
    }

    if (formData.resumen && formData.resumen.length > 500) {
      newErrors.resumen = 'El resumen no puede exceder 500 caracteres'
    }

    if (formData.botonTipo === 'WHATSAPP') {
      const clean = formData.boton_accion.replace(/\s+/g, '')
      if (!clean) {
        newErrors.boton_accion = 'Ingresa el número de WhatsApp / Teléfono'
      } else if (!/^\+?[0-9]{7,15}$/.test(clean)) {
        newErrors.boton_accion = 'Número inválido (ej: +59171234567 o 71234567)'
      }
    } else if (formData.botonTipo === 'WEB') {
      if (!formData.boton_accion.trim()) {
        newErrors.boton_accion = 'Ingresa el enlace o URL web de destino'
      } else if (!/^https?:\/\/.+/i.test(formData.boton_accion.trim())) {
        newErrors.boton_accion = 'La URL debe iniciar con http:// o https://'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isSaving) return

    await onSave(formData, imageFile)
  }

  const tiposDisponibles = Object.keys(TIPO_PUBLICACION_CONFIG) as TipoPublicacion[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {publicacionToEdit ? 'Editar Publicación' : 'Nueva Publicación en Tablón'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Difunde avisos, campañas, vacunas o promociones visibles en la App de Clientes.
            </p>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(85vh-8rem)] overflow-y-auto">
          {/* Tipo de Publicación Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Tipo de Publicación <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tiposDisponibles.map((t) => {
                const cfg = TIPO_PUBLICACION_CONFIG[t]
                const Icon = cfg.icon
                const isSelected = formData.tipo === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, tipo: t }))}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left',
                      isSelected
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Título <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.titulo.length}/200
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="Ej: Campaña Antirrábica 2026 / Jornada de Desparasitación"
              value={formData.titulo}
              onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
              className={cn(
                'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border rounded-xl outline-none transition-all placeholder:text-slate-400',
                errors.titulo
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
              )}
            />
            {errors.titulo && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.titulo}
              </p>
            )}
          </div>

          {/* Resumen Corto */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Resumen Breve (Aparece en notificación y tarjetas)
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.resumen.length}/500
              </span>
            </div>
            <input
              type="text"
              maxLength={500}
              placeholder="Ej: Descuentos del 20% en vacunación durante todo este fin de semana."
              value={formData.resumen}
              onChange={(e) => setFormData((prev) => ({ ...prev, resumen: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Contenido Completo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Contenido Detallado
            </label>
            <textarea
              rows={4}
              placeholder="Escribe los detalles completos, requisitos, horarios de atención, recomendaciones o términos de la promoción..."
              value={formData.contenido}
              onChange={(e) => setFormData((prev) => ({ ...prev, contenido: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400 resize-y"
            />
          </div>

          {/* Imagen de Portada */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Imagen de Portada (WebP optimizado automático)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreviewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group h-44 bg-slate-100 dark:bg-slate-800">
                <img
                  src={imagePreviewUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold shadow-md hover:bg-slate-100 transition-colors"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 rounded-xl bg-slate-50/50 dark:bg-slate-850/50 cursor-pointer transition-colors text-center"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Haz clic para subir o arrastrar una imagen
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  PNG, JPG o WebP (se comprimirá a 80% WebP automáticamente)
                </p>
              </div>
            )}
            {errors.imagen && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.imagen}
              </p>
            )}
          </div>

          {/* Botón de Llamada a la Acción (CTA) */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Botón de Acción (Opcional)
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleBotonTipoChange('NONE')}
                className={cn(
                  'py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center',
                  formData.botonTipo === 'NONE'
                    ? 'bg-white dark:bg-slate-900 border-teal-500 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                )}
              >
                Sin Botón
              </button>
              <button
                type="button"
                onClick={() => handleBotonTipoChange('WHATSAPP')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center',
                  formData.botonTipo === 'WHATSAPP'
                    ? 'bg-white dark:bg-slate-900 border-teal-500 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                )}
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => handleBotonTipoChange('WEB')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center',
                  formData.botonTipo === 'WEB'
                    ? 'bg-white dark:bg-slate-900 border-teal-500 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                )}
              >
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>Enlace Web</span>
              </button>
            </div>

            {formData.botonTipo !== 'NONE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={formData.boton_texto}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, boton_texto: e.target.value }))
                    }
                    placeholder={
                      formData.botonTipo === 'WHATSAPP'
                        ? 'Ej: Llamar / Agendar por WhatsApp'
                        : 'Ej: Abrir enlace / Más información'
                    }
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {formData.botonTipo === 'WHATSAPP'
                      ? 'Número de WhatsApp (+591...)'
                      : 'URL de Destino (https://...)'}
                  </label>
                  <input
                    type="text"
                    value={formData.boton_accion}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, boton_accion: e.target.value }))
                    }
                    placeholder={
                      formData.botonTipo === 'WHATSAPP'
                        ? 'Ej: +59171234567'
                        : 'https://mi-veterinaria.com/promo'
                    }
                    className={cn(
                      'w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border rounded-lg outline-none',
                      errors.boton_accion
                        ? 'border-rose-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-teal-500'
                    )}
                  />
                  {errors.boton_accion && (
                    <p className="text-[11px] text-rose-500">{errors.boton_accion}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fechas de Vigencia y Visibilidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Fecha Inicio (Opcional)
              </label>
              <input
                type="datetime-local"
                value={formData.fecha_inicio || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fecha_inicio: e.target.value || null }))
                }
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Fecha Fin (Opcional)
              </label>
              <input
                type="datetime-local"
                value={formData.fecha_fin || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fecha_fin: e.target.value || null }))
                }
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex flex-col justify-end space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Estado Inicial
              </label>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, activo: !prev.activo }))}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl border transition-all',
                  formData.activo
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-500'
                )}
              >
                <span>{formData.activo ? 'Visible para Clientes' : 'Oculto (Inactivo)'}</span>
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    formData.activo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving
                ? 'Guardando publicación...'
                : publicacionToEdit
                ? 'Actualizar Publicación'
                : 'Publicar Anuncio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
