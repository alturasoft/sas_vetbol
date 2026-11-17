import { useState, useEffect, useRef } from 'react'
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  CreditCard,
  Edit2,
  Trash2,
  RefreshCw,
  Camera,
  Sparkles,
  ZoomIn,
  Eye,
  Megaphone,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from '@/stores/useToastStore'
import { clientsService } from '@/services/clients.service'
import { storageService } from '@/services/storage.service'
import { optimizeImage, formatBytes } from '@/lib/imageOptimization'
import { cn, formatDate } from '@/lib/utils'
import { ClientRegistrationDrawer } from './components/ClientRegistrationDrawer'
import { ClientDetailModal } from './components/ClientDetailModal'
import { SendClientNoticeModal } from './components/SendClientNoticeModal'
import type { Clientes } from '@/types/database.types'

export function ClientsListPage() {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const { hasPermission } = usePermissions()

  const [clients, setClients] = useState<Clientes[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Estado del modal de edición
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState<boolean>(false)
  const [editingClient, setEditingClient] = useState<Clientes | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Estado de la Ficha de detalle del cliente
  const [detailClient, setDetailClient] = useState<Clientes | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  // Estado del modal para enviar aviso / push notification
  const [noticeClient, setNoticeClient] = useState<Clientes | null>(null)
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false)

  // Estados para la foto de perfil y optimización en cliente
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isPhotoRemoved, setIsPhotoRemoved] = useState<boolean>(false)
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalSize: number
    optimizedSize: number
    savedPercentage: number
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado de eliminación destructiva
  const [deletingClient, setDeletingClient] = useState<Clientes | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  // Vista previa de imagen flotante ampliada
  const [previewImage, setPreviewImage] = useState<{
    url: string | null
    title?: string
    subtitle?: string
  } | null>(null)

  // Formulario de cliente
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    numero_ci: '',
    telefono: '',
    email: '',
  })

  const tenantId = currentTenant?.id_veterinaria || user?.id_veterinaria || 9

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const data = await clientsService.getClients(tenantId, {
        searchTerm: searchTerm.trim() || undefined,
      })
      setClients(data)
    } catch (err: any) {
      console.error(err)
      toast.error('No se pudo cargar la lista de clientes.', 'Error de Base de Datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [tenantId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadClients()
  }

  const handlePhotoSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.warning('Por favor selecciona un archivo de imagen (PNG, JPG o WEBP).')
      return
    }

    try {
      setIsOptimizing(true)
      const result = await optimizeImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.82,
      })

      setPhotoFile(result.file)
      setPhotoPreview(result.previewUrl)
      setIsPhotoRemoved(false)
      setOptimizationInfo({
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        savedPercentage: result.savedPercentage,
      })
      toast.info(`Foto optimizada: ${formatBytes(result.originalSize)} ➔ ${formatBytes(result.optimizedSize)} (-${result.savedPercentage}%)`)
    } catch (err: any) {
      console.error('Error al optimizar imagen:', err)
      toast.error('No se pudo optimizar la imagen seleccionada.', 'Error de Compresión')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setIsPhotoRemoved(true)
    setOptimizationInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handlePhotoSelected(file)
    }
  }

  const handleOpenCreate = () => {
    if (!hasPermission('CREAR_CLIENTES')) {
      toast.error('No tienes permisos para registrar nuevos clientes.')
      return
    }
    setIsRegisterDrawerOpen(true)
  }

  const handleOpenEdit = (client: Clientes) => {
    if (!hasPermission('EDITAR_CLIENTES')) {
      toast.error('No tienes permisos para modificar información de clientes.')
      return
    }
    setEditingClient(client)
    setFormData({
      nombres: client.nombres || '',
      apellidos: client.apellidos || '',
      numero_ci: client.numero_ci || '',
      telefono: client.telefono || '',
      email: client.email || '',
    })
    setPhotoPreview(client.foto_url || null)
    setPhotoFile(null)
    setIsPhotoRemoved(false)
    setOptimizationInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsModalOpen(true)
  }

  const handleOpenDetail = (client: Clientes) => {
    setDetailClient(client)
    setIsDetailOpen(true)
  }

  const handleOpenSendNotice = (client: Clientes) => {
    setNoticeClient(client)
    setIsNoticeModalOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClient && !hasPermission('EDITAR_CLIENTES')) {
      toast.error('No tienes permisos para modificar datos de clientes.')
      return
    }
    if (!editingClient && !hasPermission('CREAR_CLIENTES')) {
      toast.error('No tienes permisos para registrar nuevos clientes.')
      return
    }
    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.telefono.trim()) {
      toast.warning('Por favor completa los nombres, apellidos y teléfono del cliente.')
      return
    }

    try {
      setIsSaving(true)

      let fotoUrl: string | null = editingClient ? (editingClient.foto_url || null) : null

      // Si el usuario seleccionó una nueva foto, subirla optimizada a Supabase Storage
      if (photoFile) {
        fotoUrl = await storageService.uploadClientPhoto(
          photoFile,
          tenantId,
          editingClient?.id_cliente
        )
      } else if (isPhotoRemoved) {
        fotoUrl = null
      }

      if (editingClient) {
        await clientsService.updateClient(editingClient.id_cliente, {
          nombres: formData.nombres.trim(),
          apellidos: formData.apellidos.trim(),
          numero_ci: formData.numero_ci.trim() || null,
          telefono: formData.telefono.trim(),
          email: formData.email.trim() || null,
          foto_url: fotoUrl,
        })
        toast.success(`Cliente ${formData.nombres} actualizado correctamente.`)
      } else {
        await clientsService.createClient({
          id_veterinaria: tenantId,
          nombres: formData.nombres.trim(),
          apellidos: formData.apellidos.trim(),
          numero_ci: formData.numero_ci.trim() || null,
          telefono: formData.telefono.trim(),
          email: formData.email.trim() || null,
          foto_url: fotoUrl,
          password: null,
          fcm_token: null,
          depto: 1, // La Paz por defecto
        })
        toast.success(`Cliente ${formData.nombres} registrado con éxito.`)
      }

      setIsModalOpen(false)
      loadClients()
    } catch (err: any) {
      console.error(err)
      toast.error('No se pudo guardar la información del cliente.', 'Error de Servidor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!deletingClient) return
    if (!hasPermission('ELIMINAR_CLIENTES')) {
      toast.error('No tienes permisos para eliminar clientes.')
      return
    }
    try {
      setIsDeleting(true)
      await clientsService.deleteClient(deletingClient.id_cliente)
      toast.success('Cliente y todos sus datos asociados eliminados de forma permanente.')
      setDeletingClient(null)
      loadClients()
    } catch (err: any) {
      console.error('Error al eliminar cliente y datos asociados:', err)
      toast.error('No se pudo eliminar el cliente. Verifique los permisos o dependencias activas.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Directorio de Clientes y Propietarios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de propietarios de mascotas registrados en la clínica (Total: {clients.length})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadClients}
            disabled={isLoading}
            className="text-xs gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {hasPermission('CREAR_CLIENTES') && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Nuevo Propietario
            </Button>
          )}
        </div>
      </div>

      {/* Main DataTable Card */}
      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Buscar por CI, nombre o WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" className="text-xs h-9">
                Buscar
              </Button>
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
              <p>Consultando base de datos de clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No se encontraron clientes"
              description="No hay propietarios que coincidan con los filtros de búsqueda aplicados."
              actionLabel={hasPermission('CREAR_CLIENTES') ? "Registrar Nuevo Propietario" : undefined}
              onAction={hasPermission('CREAR_CLIENTES') ? handleOpenCreate : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-900/80">
                    <TableHead className="w-16 text-xs font-bold text-slate-700 dark:text-slate-300">ID</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Propietario</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Documento (CI)</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Contacto</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Fecha Registro</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => {
                    const fullName = `${client.nombres} ${client.apellidos}`.trim()
                    return (
                      <TableRow key={client.id_cliente} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="font-mono text-xs text-slate-400">
                          #{client.id_cliente}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            {client.foto_url ? (
                              <div
                                className="relative group shrink-0 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPreviewImage({
                                    url: client.foto_url,
                                    title: fullName,
                                    subtitle: `Documento: ${client.numero_ci || 'Sin CI'} • Tel: ${client.telefono || 'Sin teléfono'}`,
                                  })
                                }}
                                title="Clic para ver fotografía ampliada"
                              >
                                <OptimizedImage
                                  src={client.foto_url}
                                  alt={fullName}
                                  containerClassName="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 transition-all group-hover:scale-110 group-hover:border-emerald-500 group-hover:shadow-md"
                                  imageClassName="rounded-full"
                                />
                                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn className="w-3.5 h-3.5 drop-shadow-sm" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                                {client.nombres?.[0] || 'C'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                {fullName}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                Cliente Inquilino ID: {client.id_veterinaria}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>{client.numero_ci || 'Sin CI registrado'}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {client.telefono && (
                              <a
                                href={`https://wa.me/591${client.telefono.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{client.telefono}</span>
                              </a>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{client.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(client.fecha_crea)}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetail(client)}
                              className="h-8 text-xs gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-800"
                              title="Ver Ficha del Propietario"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ficha</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenSendNotice(client)}
                              className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Enviar aviso o notificación al cliente"
                            >
                              <Megaphone className="w-3.5 h-3.5" />
                            </Button>

                            {hasPermission('EDITAR_CLIENTES') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(client)}
                                className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Editar cliente"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {hasPermission('ELIMINAR_CLIENTES') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingClient(client)}
                                className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Eliminar cliente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Creación / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingClient ? 'Editar Propietario' : 'Registrar Nuevo Propietario'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClient}>
              <div className="p-6 space-y-4">
                {/* Selector oculto de archivo */}
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

                {/* Sección de Fotografía del Cliente */}
                {photoPreview ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/30 ring-4 ring-emerald-50 bg-white shadow-xs">
                        <OptimizedImage
                          src={photoPreview}
                          alt="Foto del propietario"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isOptimizing || isSaving}
                        className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white cursor-pointer"
                        title="Cambiar fotografía"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Fotografía del Propietario
                        </span>
                        {optimizationInfo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            WebP optimizado ({formatBytes(optimizationInfo.optimizedSize)})
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500">
                        {optimizationInfo
                          ? `Optimizado: de ${formatBytes(optimizationInfo.originalSize)} a ${formatBytes(optimizationInfo.optimizedSize)} (-${optimizationInfo.savedPercentage}% de peso).`
                          : 'Fotografía para identificar al cliente en fichas, historias y citas.'}
                      </p>

                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isOptimizing || isSaving}
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
                          disabled={isOptimizing || isSaving}
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
                    onClick={() => !isOptimizing && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed transition-all text-center group cursor-pointer',
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20'
                    )}
                  >
                    {isOptimizing ? (
                      <div className="py-2 flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">
                          Optimizando imagen...
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Comprimiendo a WebP de alta fidelidad sin perder calidad
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                          Subir fotografía del cliente
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Haz clic o arrastra una imagen aquí (PNG, JPG, WEBP)
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          Compresión y optimización automática sin pérdida de nitidez
                        </span>
                      </>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nombres *</label>
                    <Input
                      type="text"
                      required
                      placeholder="Ej: Marcelo"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Apellidos *</label>
                    <Input
                      type="text"
                      required
                      placeholder="Ej: Claure"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Carnet de Identidad (CI)</label>
                    <Input
                      type="text"
                      placeholder="Ej: 676767 LP"
                      value={formData.numero_ci}
                      onChange={(e) => setFormData({ ...formData, numero_ci: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Teléfono / WhatsApp *</label>
                    <Input
                      type="text"
                      required
                      placeholder="Ej: 71098234"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
                  <Input
                    type="email"
                    placeholder="propietario@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div>
                  {editingClient && hasPermission('ELIMINAR_CLIENTES') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const clientToDelete = editingClient
                        setIsModalOpen(false)
                        setDeletingClient(clientToDelete)
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar Cliente
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving || isOptimizing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    {isSaving
                      ? photoFile
                        ? 'Subiendo foto y guardando...'
                        : 'Guardando...'
                      : editingClient
                      ? 'Actualizar Cliente'
                      : 'Guardar Cliente'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Destructiva para Eliminación Limpia */}
      <ConfirmDialog
        isOpen={!!deletingClient}
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">⚠️</span>
            <span className="text-base font-bold text-slate-900">¿Eliminar Cliente?</span>
          </div>
        }
        description={
          deletingClient ? (
            <div className="space-y-4 text-left pt-1">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                  ¡ADVERTENCIA: Esta acción es IRREVERSIBLE!
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-800">
                  Se eliminará permanentemente:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold leading-none">•</span>
                    <span>
                      Al cliente:{' '}
                      <strong className="text-slate-900 font-semibold">
                        {deletingClient.nombres} {deletingClient.apellidos}
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold leading-none">•</span>
                    <span>Todas sus mascotas registradas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold leading-none">•</span>
                    <span>Todo su historial clínico y de vacunas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold leading-none">•</span>
                    <span>Todas las citas e imágenes asociadas</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs font-medium text-slate-800 pt-1">
                ¿Está seguro de que desea realizar una eliminación completa y limpia?
              </p>
            </div>
          ) : undefined
        }
        confirmText="Eliminar Todo"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteClient}
        onClose={() => !isDeleting && setDeletingClient(null)}
      />

      {/* Drawer de Alta Secuencial: Propietario + Mascota y Vacunas */}
      <ClientRegistrationDrawer
        isOpen={isRegisterDrawerOpen}
        onClose={() => setIsRegisterDrawerOpen(false)}
        onSuccess={loadClients}
        tenantId={tenantId}
      />

      {/* Modal Ficha del Cliente y sus Mascotas */}
      <ClientDetailModal
        isOpen={isDetailOpen}
        client={detailClient}
        tenantId={tenantId}
        onClose={() => {
          setIsDetailOpen(false)
          setDetailClient(null)
        }}
        onEdit={
          hasPermission('EDITAR_CLIENTES')
            ? (client) => {
                handleOpenEdit(client)
              }
            : undefined
        }
        onSendNotice={
          hasPermission('ADMINISTRAR_PUBLICACIONES') || hasPermission('EDITAR_CLIENTES')
            ? (client) => {
                handleOpenSendNotice(client)
              }
            : undefined
        }
      />

      {/* Modal de Enviar Aviso al Cliente */}
      <SendClientNoticeModal
        isOpen={isNoticeModalOpen}
        client={noticeClient}
        tenantId={tenantId}
        onClose={() => {
          setIsNoticeModalOpen(false)
          setNoticeClient(null)
        }}
      />

      {/* Modal de Imagen Flotante Ampliada */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  )
}
