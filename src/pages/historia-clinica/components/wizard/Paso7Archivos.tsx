import { useState, useRef } from 'react'
import {
  FolderOpen,
  Camera,
  Image as ImageIcon,
  FileText,
  Upload,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import type { HistoriaArchivos } from '@/types/medical-record.types'

export function Paso7Archivos() {
  const { archivos, uploadArchivo, deleteArchivo, setStep, isSaving, error } =
    useConsultationWizardStore()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tipoArchivo, setTipoArchivo] = useState<'FOTO' | 'RADIOGRAFIA' | 'DOCUMENTO'>('FOTO')
  const [observaciones, setObservaciones] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Preview ampliado
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [deletingFile, setDeletingFile] = useState<{ id: number; url: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleSelectFile = (file: File, type: 'FOTO' | 'RADIOGRAFIA' | 'DOCUMENTO') => {
    setSelectedFile(file)
    setTipoArchivo(type)
    setObservaciones('')
    setIsModalOpen(true)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    const success = await uploadArchivo(selectedFile, {
      tipo_archivo: tipoArchivo,
      observaciones: observaciones.trim() || undefined,
    })

    if (success) {
      setIsModalOpen(false)
      setSelectedFile(null)
      setObservaciones('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingFile) return
    await deleteArchivo(deletingFile.id, deletingFile.url)
    setDeletingFile(null)
  }

  return (
    <>
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Paso 7: Archivos Clínicos & Multimedia
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Evidencia fotográfica, radiografías y documentos complementarios en Supabase Storage
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Botones de acción directa para capturar / subir */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleSelectFile(file, 'FOTO')
                e.target.value = ''
              }}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const isImage = file.type.startsWith('image/')
                  handleSelectFile(file, isImage ? 'FOTO' : 'DOCUMENTO')
                }
                e.target.value = ''
              }}
            />

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/40 dark:hover:bg-slate-800 text-left transition-all group flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                  Tomar Foto Clínica
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Captura directa desde la cámara
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoArchivo('RADIOGRAFIA')
                fileInputRef.current?.click()
              }}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/40 dark:hover:bg-slate-800 text-left transition-all group flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-500 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                  Subir Radiografía / Imagen
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Optimización WebP automática
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoArchivo('DOCUMENTO')
                fileInputRef.current?.click()
              }}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/40 dark:hover:bg-slate-800 text-left transition-all group flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-500 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                  Adjuntar Documento
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Informes externos, PDFs y consentimientos
                </span>
              </div>
            </button>
          </div>

          {/* Galería de Archivos Adjuntos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Archivos Clínicos Guardados ({archivos.length})
            </h4>

            {archivos.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No se han adjuntado archivos multimedia en esta consulta.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Usa los botones superiores para capturar fotos o subir radiografías y documentos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {archivos.map((a: HistoriaArchivos) => {
                  const isImg = a.extension === 'webp' || a.extension === 'jpg' || a.extension === 'png' || a.tipo_archivo === 'FOTO' || a.tipo_archivo === 'RADIOGRAFIA'

                  return (
                    <div
                      key={a.id_archivo}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs space-y-2 flex flex-col justify-between"
                    >
                      {/* Thumbnail or icon */}
                      <div className="flex items-center gap-2.5">
                        {isImg ? (
                          <div
                            onClick={() => setPreviewImageUrl(a.url_archivo)}
                            className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-pointer relative group shrink-0 border border-slate-200 dark:border-slate-700"
                          >
                            <img
                              src={a.url_archivo}
                              alt={a.nombre_archivo || 'Archivo'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-500">
                            <FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge variant="outline" className="text-[9px] uppercase dark:border-slate-700 dark:text-slate-300">
                              {a.tipo_archivo || 'FOTO'}
                            </Badge>
                            {a.tamano_kb && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {a.tamano_kb} KB
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                            {a.nombre_archivo || 'Archivo adjunto'}
                          </span>
                          {a.observaciones && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {a.observaciones}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer de card con acciones */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <a
                          href={a.url_archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold hover:underline"
                        >
                          Abrir archivo
                        </a>

                        <button
                          type="button"
                          onClick={() => setDeletingFile({ id: a.id_archivo, url: a.url_archivo })}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Navegación */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(6)}
              className="gap-2 text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Exámenes</span>
            </Button>

            <Button
              type="button"
              onClick={() => setStep(8)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <span>Continuar a Cierre & PDF</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación para subir archivo seleccionado */}
      {isModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Adjuntar Archivo al Expediente</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedFile(null)
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">Archivo seleccionado:</span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                    {Math.round(selectedFile.size / 1024)} KB
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tipo de Documento
                </label>
                <select
                  value={tipoArchivo}
                  onChange={(e) => setTipoArchivo(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="FOTO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Fotografía Clínica</option>
                  <option value="RADIOGRAFIA" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Radiografía / Ecografía</option>
                  <option value="DOCUMENTO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Informe de Laboratorio / Documento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Observaciones / Descripción del Archivo
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Radiografía lateral torácica mostrando silueta cardíaca..."
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false)
                    setSelectedFile(null)
                  }}
                  className="text-xs dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  {isSaving ? 'Subiendo y optimizando...' : 'Subir Archivo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal visor de imagen ampliada */}
      <ImagePreviewModal
        isOpen={previewImageUrl !== null}
        imageUrl={previewImageUrl}
        title="Visualización de Evidencia Clínica"
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Modal de confirmación para eliminar archivo */}
      <ConfirmDialog
        isOpen={deletingFile !== null}
        variant="danger"
        title="Eliminar Archivo Clínico"
        description="¿Confirmas la eliminación de este archivo del expediente y del servidor de almacenamiento?"
        confirmText="Eliminar"
        cancelText="Conservar"
        isLoading={isSaving}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingFile(null)}
      />
    </>
  )
}
