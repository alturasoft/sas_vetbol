import { useState, useEffect, useMemo } from 'react'
import {
  Scissors,
  Plus,
  Calendar,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Play,
  Loader2,
  Syringe,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from '@/stores/useToastStore'
import { cirugiasService } from '@/services/cirugias.service'
import { formatDateTime } from '@/lib/utils'
import type { Cirugia, EstadoCirugia } from '@/types/cirugia.types'

import { NewSurgeryModal } from './components/NewSurgeryModal'
import { FinalizeSurgeryModal } from './components/FinalizeSurgeryModal'
import { SurgeryDetailModal } from './components/SurgeryDetailModal'

export function SurgeriesPage() {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const { hasPermission } = usePermissions()

  const [surgeries, setSurgeries] = useState<Cirugia[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<EstadoCirugia | 'TODAS'>('TODAS')

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedSurgery, setSelectedSurgery] = useState<Cirugia | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [surgeryToFinalize, setSurgeryToFinalize] = useState<Cirugia | null>(null)
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false)

  const tenantId = currentTenant?.id_veterinaria || user?.id_veterinaria || 9

  const canManageSurgery =
    hasPermission('CIRUGIA_OP') || hasPermission('CREAR_CONSULTA')

  const loadSurgeries = async () => {
    try {
      setIsLoading(true)
      const data = await cirugiasService.getCirugias(tenantId, {
        filterStatus: activeFilter,
        search: searchTerm,
      })
      setSurgeries(data)
    } catch (err) {
      console.error('Error al cargar agenda quirúrgica:', err)
      toast.error('No se pudo cargar la programación de quirófano')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSurgeries()
  }, [tenantId, activeFilter])

  // Filtrado reactivo en memoria
  const filteredSurgeries = useMemo(() => {
    if (!searchTerm.trim()) return surgeries
    const term = searchTerm.toLowerCase().trim()
    return surgeries.filter((surg) => {
      const pet = surg.mascota?.nombre?.toLowerCase() || ''
      const proc = surg.procedimiento?.toLowerCase() || ''
      const surgeon = surg.cirujano?.toLowerCase() || ''
      const tutor = `${surg.mascota?.cliente?.nombres || ''} ${surg.mascota?.cliente?.apellidos || ''}`.toLowerCase()
      return pet.includes(term) || proc.includes(term) || surgeon.includes(term) || tutor.includes(term)
    })
  }, [surgeries, searchTerm])

  // Métricas
  const programadasCount = surgeries.filter((s) => s.estado === 'PROGRAMADA').length
  const enProcesoCount = surgeries.filter((s) => s.estado === 'EN_PROCESO').length
  const finalizadasCount = surgeries.filter((s) => s.estado === 'FINALIZADA').length

  const getStatusBadge = (estado: EstadoCirugia) => {
    switch (estado) {
      case 'PROGRAMADA':
        return (
          <Badge className="bg-[#3F51B5] hover:bg-[#3949AB] text-white text-[11px]">
            Programada
          </Badge>
        )
      case 'EN_PROCESO':
        return (
          <Badge className="bg-[#FF9800] hover:bg-[#F57C00] text-white text-[11px] animate-pulse">
            En Quirófano
          </Badge>
        )
      case 'FINALIZADA':
        return (
          <Badge className="bg-[#4CAF50] hover:bg-[#43A047] text-white text-[11px]">
            Finalizada
          </Badge>
        )
      case 'CANCELADA':
        return (
          <Badge className="bg-[#F44336] hover:bg-[#E53935] text-white text-[11px]">
            Cancelada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const handleOpenDetail = (surgery: Cirugia) => {
    setSelectedSurgery(surgery)
    setIsDetailModalOpen(true)
  }

  const handleStartSurgery = async (e: React.MouseEvent, surgery: Cirugia) => {
    e.stopPropagation()
    try {
      await cirugiasService.iniciarCirugia(surgery.id_cirugia)
      toast.success(`Cirugía de ${surgery.procedimiento} iniciada en quirófano`)
      loadSurgeries()
    } catch (err) {
      console.error(err)
      toast.error('Error al iniciar la cirugía')
    }
  }

  const handleOpenFinalize = (e: React.MouseEvent, surgery: Cirugia) => {
    e.stopPropagation()
    setSurgeryToFinalize(surgery)
    setIsFinalizeModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Agenda de Quirófano y Procedimientos Quirúrgicos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Programación de intervenciones, seguimiento anestésico y protocolos operatorios
          </p>
        </div>

        {canManageSurgery && (
          <Button
            onClick={() => setIsNewModalOpen(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Programar Cirugía
          </Button>
        )}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cirugías Programadas
              </p>
              <h3 className="text-2xl font-bold text-[#3F51B5] mt-1">
                {programadasCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-[#3F51B5] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                En Quirófano / En Curso
              </p>
              <h3 className="text-2xl font-bold text-[#FF9800] mt-1">
                {enProcesoCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-[#FF9800] flex items-center justify-center font-bold animate-pulse">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cirugías Concluidas
              </p>
              <h3 className="text-2xl font-bold text-[#4CAF50] mt-1">
                {finalizadasCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#4CAF50] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto">
          {(
            [
              { key: 'TODAS', label: 'Todas' },
              { key: 'PROGRAMADA', label: 'Programadas' },
              { key: 'EN_PROCESO', label: 'En Quirófano' },
              { key: 'FINALIZADA', label: 'Finalizadas' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeFilter === tab.key
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por paciente, procedimiento o cirujano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* List / Grid of Surgeries */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          <Loader2 className="inline-block animate-spin h-8 w-8 text-indigo-600 mb-3" />
          <p className="text-sm">Consultando programación de cirugías...</p>
        </div>
      ) : filteredSurgeries.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No hay cirugías registradas"
          description={
            activeFilter === 'TODAS'
              ? 'No hay procedimientos programados ni en quirófano actualmente.'
              : `No se encontraron cirugías en estado ${activeFilter}.`
          }
          actionLabel={canManageSurgery ? 'Programar Cirugía' : undefined}
          onAction={() => setIsNewModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSurgeries.map((surg) => {
            const pet = surg.mascota
            const client = pet?.cliente
            const isEnProceso = surg.estado === 'EN_PROCESO'
            const isProgramada = surg.estado === 'PROGRAMADA'
            const isFinalizada = surg.estado === 'FINALIZADA'

            return (
              <Card
                key={surg.id_cirugia}
                onClick={() => handleOpenDetail(surg)}
                className={`border bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isEnProceso
                    ? 'border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-400/40'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {surg.procedimiento}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Paciente: <strong>{pet?.nombre}</strong> ({pet?.especie} {pet?.raza ? `• ${pet.raza}` : ''})
                      </p>
                    </div>
                  </div>

                  {getStatusBadge(surg.estado)}
                </div>

                <CardContent className="p-4 space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(surg.fecha_cirugia)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">Cirujano: {surg.cirujano}</span>
                    </div>
                  </div>

                  {surg.anestesia && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Syringe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">
                        <strong className="text-slate-900 dark:text-slate-100">Anestesia:</strong> {surg.anestesia}
                      </span>
                    </div>
                  )}

                  {surg.observaciones && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                      "{surg.observaciones}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>
                      Tutor: {client?.nombres || 'Sin tutor'} {client?.apellidos || ''}
                    </span>
                    {client?.telefono && <span>Tel: {client.telefono}</span>}
                  </div>
                </CardContent>

                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-indigo-600 dark:text-indigo-400 p-0 h-auto"
                  >
                    Ver Ficha Quirúrgica
                  </Button>

                  <div className="flex items-center gap-2">
                    {canManageSurgery && isProgramada && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => handleStartSurgery(e, surg)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white p-1 px-3 h-auto gap-1"
                      >
                        <Play className="w-3 h-3" /> Iniciar
                      </Button>
                    )}

                    {canManageSurgery && isEnProceso && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => handleOpenFinalize(e, surg)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white p-1 px-3 h-auto gap-1 animate-pulse"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Finalizar
                      </Button>
                    )}

                    {isFinalizada && (
                      <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300">
                        Protocolo Registrado
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modales */}
      <NewSurgeryModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={loadSurgeries}
        idVeterinaria={tenantId}
      />

      <SurgeryDetailModal
        isOpen={isDetailModalOpen}
        surgery={selectedSurgery}
        onClose={() => setIsDetailModalOpen(false)}
        onFinalizeClick={(surg) => {
          setIsDetailModalOpen(false)
          setSurgeryToFinalize(surg)
          setIsFinalizeModalOpen(true)
        }}
        onSurgeryUpdated={loadSurgeries}
      />

      <FinalizeSurgeryModal
        isOpen={isFinalizeModalOpen}
        surgery={surgeryToFinalize}
        onClose={() => setIsFinalizeModalOpen(false)}
        onSuccess={loadSurgeries}
      />
    </div>
  )
}
