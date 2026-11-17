import { useState, useEffect, useMemo } from 'react'
import {
  BedDouble,
  Plus,
  HeartPulse,
  Clock,
  User,
  Search,
  CheckCircle2,
  Calendar,
  LayoutGrid,
  List,
  Filter,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from '@/stores/useToastStore'
import { hospitalizacionesService } from '@/services/hospitalizaciones.service'
import { formatDateTime } from '@/lib/utils'
import type { Hospitalizacion } from '@/types/hospitalizacion.types'

import { NewAdmissionModal } from './components/NewAdmissionModal'
import { AdmissionDetailDrawer } from './components/AdmissionDetailDrawer'
import { DischargeModal } from './components/DischargeModal'
import { CageCard } from './components/CageCard'

const DEFAULT_CAGES = [
  'Canil 01',
  'Canil 02',
  'Canil 03',
  'Canil 04',
  'Canil 05',
  'Canil 06',
  'Jaula UCI-01',
  'Jaula UCI-02',
  'Box Felino 01',
  'Box Felino 02',
]

export function HospitalizationBoardPage() {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const { hasPermission } = usePermissions()

  const [admissions, setAdmissions] = useState<Hospitalizacion[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'INTERNADOS' | 'HISTORIAL'>('INTERNADOS')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Modales y drawers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedCageForNew, setSelectedCageForNew] = useState('')
  const [selectedAdmission, setSelectedAdmission] = useState<Hospitalizacion | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [admissionToDischarge, setAdmissionToDischarge] = useState<Hospitalizacion | null>(null)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)

  const tenantId = currentTenant?.id_veterinaria || user?.id_veterinaria || 9

  const canManageHospitalization =
    hasPermission('HOSPITALIZACION_OP') || hasPermission('CREAR_CONSULTA')

  const loadAdmissions = async () => {
    try {
      setIsLoading(true)
      const data = await hospitalizacionesService.getHospitalizaciones(tenantId, {
        soloInternados: activeTab === 'INTERNADOS',
        search: searchTerm,
      })
      setAdmissions(data)
    } catch (err) {
      console.error('Error al cargar hospitalizaciones:', err)
      toast.error('No se pudieron cargar los registros de hospitalización')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdmissions()
  }, [tenantId, activeTab])

  // Filtrado reactivo en memoria por si el usuario escribe en búsqueda
  const filteredAdmissions = useMemo(() => {
    if (!searchTerm.trim()) return admissions
    const term = searchTerm.toLowerCase().trim()
    return admissions.filter((adm) => {
      const pet = adm.mascota?.nombre?.toLowerCase() || ''
      const tutor = `${adm.mascota?.cliente?.nombres || ''} ${adm.mascota?.cliente?.apellidos || ''}`.toLowerCase()
      const cage = adm.habitacion?.toLowerCase() || ''
      const reason = adm.motivo_ingreso?.toLowerCase() || ''
      return pet.includes(term) || tutor.includes(term) || cage.includes(term) || reason.includes(term)
    })
  }, [admissions, searchTerm])

  // Métricas
  const internadosActivos = admissions.filter((a) => a.estado === 'INTERNADO').length
  const altasMedicas = admissions.filter((a) => a.estado === 'ALTA').length

  const handleOpenDetail = (adm: Hospitalizacion) => {
    setSelectedAdmission(adm)
    setIsDetailDrawerOpen(true)
  }

  const handleStartDischarge = (adm: Hospitalizacion) => {
    setAdmissionToDischarge(adm)
    setIsDischargeModalOpen(true)
  }

  const handleAssignCage = (cageName: string) => {
    setSelectedCageForNew(cageName)
    setIsNewModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BedDouble className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Control de Hospitalizaciones (Bed Management)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervisión clínica de jaulas, caniles de internación y evolución horaria de pacientes
          </p>
        </div>

        {canManageHospitalization && (
          <Button
            onClick={() => {
              setSelectedCageForNew('')
              setIsNewModalOpen(true)
            }}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Ingresar Paciente
          </Button>
        )}
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pacientes Internados
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {internadosActivos}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Jaulas Disponibles
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {Math.max(0, DEFAULT_CAGES.length - internadosActivos)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Altas Médicas Registradas
              </p>
              <h3 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                {altasMedicas}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Tabs: Internados Activos vs Historial */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('INTERNADOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'INTERNADOS'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Internados Activos ({internadosActivos})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'HISTORIAL'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Historial de Altas
          </button>
        </div>

        {/* Search and View Mode */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por paciente, tutor, jaula o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {activeTab === 'INTERNADOS' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista Tablero de Jaulas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          <Loader2 className="inline-block animate-spin h-8 w-8 text-amber-600 mb-3" />
          <p className="text-sm">Consultando estado de internaciones en la clínica...</p>
        </div>
      ) : activeTab === 'INTERNADOS' && viewMode === 'grid' ? (
        /* Tablero de Jaulas / Bed Management */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DEFAULT_CAGES.map((cageName) => {
            const adm = filteredAdmissions.find(
              (a) =>
                a.habitacion?.trim().toLowerCase() === cageName.trim().toLowerCase()
            )
            return (
              <CageCard
                key={cageName}
                cageName={cageName}
                admission={adm}
                canManage={canManageHospitalization}
                onSelectAdmission={handleOpenDetail}
                onAssignPatient={handleAssignCage}
                onDischargeClick={handleStartDischarge}
              />
            )
          })}

          {/* Pacientes cuya jaula no está en DEFAULT_CAGES */}
          {filteredAdmissions
            .filter(
              (a) =>
                !DEFAULT_CAGES.some(
                  (c) => c.toLowerCase() === a.habitacion?.trim().toLowerCase()
                )
            )
            .map((adm) => (
              <CageCard
                key={adm.id_hospitalizacion}
                cageName={adm.habitacion || 'Sala General'}
                admission={adm}
                canManage={canManageHospitalization}
                onSelectAdmission={handleOpenDetail}
                onAssignPatient={handleAssignCage}
                onDischargeClick={handleStartDischarge}
              />
            ))}
        </div>
      ) : filteredAdmissions.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title={
            activeTab === 'INTERNADOS'
              ? 'No hay pacientes hospitalizados actualmente'
              : 'No hay registros en el historial'
          }
          description={
            activeTab === 'INTERNADOS'
              ? 'Todas las jaulas y salas de internación se encuentran libres y disponibles.'
              : 'Las altas médicas y egresos clínicos aparecerán aquí.'
          }
          actionLabel={
            canManageHospitalization && activeTab === 'INTERNADOS'
              ? 'Ingresar Paciente'
              : undefined
          }
          onAction={() => setIsNewModalOpen(true)}
        />
      ) : (
        /* Vista de Lista Detallada */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAdmissions.map((adm) => {
            const pet = adm.mascota
            const client = pet?.cliente
            const isInternado = adm.estado === 'INTERNADO'

            return (
              <Card
                key={adm.id_hospitalizacion}
                onClick={() => handleOpenDetail(adm)}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-amber-400 dark:hover:border-amber-700/80 transition-all cursor-pointer overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={pet?.foto_url}
                      fallback={pet?.nombre || 'VET'}
                      className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {pet?.nombre}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {pet?.especie} {pet?.raza ? `• ${pet.raza}` : ''}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      isInternado ? 'warning' : adm.estado === 'ALTA' ? 'success' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {isInternado ? 'Internado' : adm.estado}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Habitación / Jaula:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {adm.habitacion || 'Sin asignar'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ingreso:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDateTime(adm.fecha_ingreso)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Motivo:{' '}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {adm.motivo_ingreso}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Tutor: {client?.nombres || 'Sin tutor'} {client?.apellidos || ''}
                    </span>
                    {client?.telefono && <span>Tel: {client.telefono}</span>}
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-amber-700 dark:text-amber-400 p-0 h-auto gap-1"
                  >
                    Ver Evolución Clínica <ArrowRight className="w-3.5 h-3.5" />
                  </Button>

                  {isInternado && canManageHospitalization && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartDischarge(adm)
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white p-1 px-3 h-auto"
                    >
                      Dar de Alta
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modales */}
      <NewAdmissionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={loadAdmissions}
        idVeterinaria={tenantId}
        initialCage={selectedCageForNew}
      />

      <AdmissionDetailDrawer
        isOpen={isDetailDrawerOpen}
        admission={selectedAdmission}
        onClose={() => setIsDetailDrawerOpen(false)}
        onDischargeClick={(adm) => {
          setIsDetailDrawerOpen(false)
          handleStartDischarge(adm)
        }}
        onAdmissionUpdated={loadAdmissions}
      />

      <DischargeModal
        isOpen={isDischargeModalOpen}
        admission={admissionToDischarge}
        onClose={() => setIsDischargeModalOpen(false)}
        onSuccess={loadAdmissions}
      />
    </div>
  )
}
