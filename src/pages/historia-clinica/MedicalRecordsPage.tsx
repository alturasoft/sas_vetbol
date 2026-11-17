import { useState } from 'react'
import {
  FileText,
  Plus,
  Search,
  Stethoscope,
  HeartPulse,
  Thermometer,
  Weight,
  Calendar,
  Clock,
  Printer,
  Edit,
  ArrowRight,
  Activity,
  AlertCircle,
  Eye,
  Sliders,
  Pill,
  ClipboardList,
  FlaskConical,
  FolderOpen,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { medicalRecordsService } from '@/services/medical-records.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import { PatientSelectModal } from './components/PatientSelectModal'
import { MedicalRecordPrintView } from './components/MedicalRecordPrintView'
import { printDocument } from '@/utils/printDocument'
import type { ConsultaDetallada } from '@/types/medical-record.types'
import type { MascotaConCliente } from '@/types/patient.types'

export function MedicalRecordsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hasPermission } = usePermissions()
  const { initWizard } = useConsultationWizardStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null)
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  const idVeterinaria = user?.id_veterinaria || 1

  // Query para el listado de historias clínicas de la clínica
  const {
    data: records = [],
    isLoading: isListLoading,
    refetch,
  } = useQuery({
    queryKey: ['medical-records', idVeterinaria, statusFilter, searchTerm],
    queryFn: () =>
      medicalRecordsService.getMedicalRecords(idVeterinaria, {
        searchTerm: searchTerm.trim() || undefined,
        estado: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
    enabled: !!idVeterinaria,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Seleccionar por defecto el primer registro si no hay uno seleccionado
  const activeRecordId = selectedRecordId || (records.length > 0 ? records[0].id_historia_clinica : null)

  // Query para el detalle completo del registro seleccionado
  const { data: selectedRecord, isLoading: isDetailLoading } = useQuery({
    queryKey: ['medical-record-detail', activeRecordId],
    queryFn: () => (activeRecordId ? medicalRecordsService.getMedicalRecordById(activeRecordId) : null),
    enabled: !!activeRecordId,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const handleSelectPatient = (patient: MascotaConCliente) => {
    setIsPatientModalOpen(false)
    initWizard(patient)
    navigate(`/historia-clinica/nueva?idMascota=${patient.id_mascota}`)
  }

  const handleResumeConsultation = (idHistoria: number) => {
    navigate(`/historia-clinica/nueva?idHistoria=${idHistoria}`)
  }

  const handlePrintDocument = () => {
    if (!selectedRecord) return
    const docCode = selectedRecord.numero_historia || `HC-${selectedRecord.id_historia_clinica}`
    const petName = (selectedRecord.mascota as any)?.nombre || 'Paciente'
    printDocument({
      target: 'medical-record-print-sheet',
      documentTitle: `Expediente_${petName}_${docCode}`,
      pageSize: 'letter',
      pageOrientation: 'portrait',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Historias Clínicas & Expediente SOAP
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro médico formal, anamnesis, exploración física, diagnósticos y terapéutica
          </p>
        </div>

        {hasPermission('CREAR_CONSULTA') && (
          <Button
            onClick={() => setIsPatientModalOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nueva Consulta SOAP
          </Button>
        )}
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por paciente, tutor, motivo o N° de historia..."
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 pl-9 pr-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ABIERTA">En curso (ABIERTA)</option>
            <option value="CERRADA">Cerradas (CERRADA)</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-9 text-slate-600 dark:text-slate-400"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Main split view: Records list on left, Full SOAP on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Consultations (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Consultas Registradas ({records.length})
            </h3>
            {isListLoading && <span className="text-[10px] text-slate-400">Cargando...</span>}
          </div>

          <div className="space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
            {isListLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Consultando expedientes en la base de datos...
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No hay consultas registradas</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Haz clic en "Nueva Consulta SOAP" para comenzar la primera atención.
                </p>
              </div>
            ) : (
              records.map((record) => {
                const isSelected = activeRecordId === record.id_historia_clinica
                const petName = (record.mascota as any)?.nombre || 'Paciente'
                const petSpecies = (record.mascota as any)?.especie || ''
                const ownerName = record.cliente
                  ? `${record.cliente.nombres || ''} ${record.cliente.apellidos || ''}`.trim()
                  : 'Sin tutor'
                const vetName = record.personal
                  ? `${record.personal.nombres} ${record.personal.apellidos}`
                  : 'Veterinario'
                const isAbierta = record.estado === 'ABIERTA'

                return (
                  <div
                    key={record.id_historia_clinica}
                    onClick={() => setSelectedRecordId(record.id_historia_clinica)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{petName}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400">({petSpecies})</span>
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate block mt-0.5">
                          Tutor: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{ownerName}</strong>
                        </span>
                      </div>

                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold ${
                            isAbierta
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/50'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50'
                          }`}
                        >
                          {record.estado || 'ABIERTA'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-1 font-mono">
                          {new Date(record.fecha_consulta).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed bg-slate-50/80 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-slate-200">Motivo:</strong> {record.motivo_consulta || 'Sin motivo registrado'}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{vetName}</span>
                      </div>

                      {isAbierta && hasPermission('EDITAR_CONSULTA') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResumeConsultation(record.id_historia_clinica)
                          }}
                          className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Continuar</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Complete SOAP Form Display (8 cols) */}
        <div className="lg:col-span-8">
          {isDetailLoading ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Cargando detalle del expediente SOAP...
            </div>
          ) : !selectedRecord ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Selecciona una consulta de la lista para ver su expediente clínico completo.
            </div>
          ) : (
            <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Ficha de Atención: {(selectedRecord.mascota as any)?.nombre || 'Paciente'}
                      </CardTitle>
                      <Badge
                        className={`text-[10px] font-bold ${
                          selectedRecord.estado === 'CERRADA'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/50'
                        }`}
                      >
                        {selectedRecord.estado}
                      </Badge>
                    </div>

                    <CardDescription className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                      {selectedRecord.tipo_consulta || 'Consulta General'} • Atendido el{' '}
                      {new Date(selectedRecord.fecha_consulta).toLocaleString('es-BO')}
                      {selectedRecord.numero_historia && ` • ${selectedRecord.numero_historia}`}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedRecord.estado === 'ABIERTA' && hasPermission('EDITAR_CONSULTA') && (
                      <Button
                        size="sm"
                        onClick={() => handleResumeConsultation(selectedRecord.id_historia_clinica)}
                        className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar / Continuar</span>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPrintModalOpen(true)}
                      className="text-xs gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Ficha / Receta</span>
                    </Button>
                  </div>
                </div>

                {/* Barra de Signos Vitales */}
                {selectedRecord.signos_vitales && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <Weight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">Peso</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedRecord.signos_vitales.peso ? `${selectedRecord.signos_vitales.peso} kg` : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">Temperatura</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedRecord.signos_vitales.temperatura ? `${selectedRecord.signos_vitales.temperatura} °C` : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">F.C.</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedRecord.signos_vitales.frecuencia_cardiaca ? `${selectedRecord.signos_vitales.frecuencia_cardiaca} lpm` : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">F.R.</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedRecord.signos_vitales.frecuencia_respiratoria ? `${selectedRecord.signos_vitales.frecuencia_respiratoria} rpm` : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">Mucosas</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedRecord.signos_vitales.mucosas || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">Condición</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedRecord.signos_vitales.condicion_corporal ? `${selectedRecord.signos_vitales.condicion_corporal}/9` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* S: Subjetivo */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center text-[10px]">
                      S
                    </span>
                    Subjetivo (Motivo de Consulta & Anamnesis)
                  </div>
                  <div className="pl-7 space-y-1.5 text-xs">
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">
                      Motivo: {selectedRecord.motivo_consulta}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Anamnesis: {selectedRecord.anamnesis}
                    </p>
                    {selectedRecord.observaciones && (
                      <p className="text-slate-500 dark:text-slate-400 italic">
                        Observaciones: {selectedRecord.observaciones}
                      </p>
                    )}
                  </div>
                </div>

                {/* O: Objetivo (Signos & Exámenes) */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-[10px]">
                      O
                    </span>
                    Objetivo (Examen Clínico & Exámenes Complementarios)
                  </div>
                  <div className="pl-7 space-y-2 text-xs">
                    {selectedRecord.signos_vitales?.observaciones && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">Hallazgos físicos:</strong> {selectedRecord.signos_vitales.observaciones}
                      </p>
                    )}

                    {selectedRecord.examenes && selectedRecord.examenes.length > 0 ? (
                      <div className="space-y-1 pt-1">
                        <strong className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Exámenes Solicitados:
                        </strong>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {selectedRecord.examenes.map((e) => (
                            <div key={e.id_examen} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{e.tipo_examen}</span>
                              {e.resultado && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{e.resultado}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Sin exámenes complementarios solicitados.</p>
                    )}
                  </div>
                </div>

                {/* A: Diagnósticos */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center text-[10px]">
                      A
                    </span>
                    Evaluación (Diagnósticos Presuntivos & Definitivos)
                  </div>
                  <div className="pl-7 text-xs">
                    {selectedRecord.diagnosticos && selectedRecord.diagnosticos.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedRecord.diagnosticos.map((d) => (
                          <div
                            key={d.id_diagnostico}
                            className="flex flex-wrap items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{d.diagnostico}</span>
                              {d.codigo_cie_vet && (
                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  {d.codigo_cie_vet}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{d.tipo_diagnostico}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {d.gravedad}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Sin diagnósticos asentados.</p>
                    )}
                  </div>
                </div>

                {/* P: Plan Terapéutico y Farmacia */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      P
                    </span>
                    Plan (Procedimientos en Clínica & Recetas Farmacológicas)
                  </div>
                  <div className="pl-7 space-y-3 text-xs">
                    {/* Tratamientos */}
                    {selectedRecord.tratamientos && selectedRecord.tratamientos.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Procedimientos:
                        </strong>
                        {selectedRecord.tratamientos.map((t) => (
                          <div key={t.id_tratamiento} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{t.tratamiento}</span>
                            {t.indicaciones && <p className="text-slate-600 dark:text-slate-400 mt-0.5">{t.indicaciones}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recetas */}
                    {selectedRecord.recetas && selectedRecord.recetas.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Recetas Médicas Prescritas:
                        </strong>
                        {selectedRecord.recetas.map((r) => (
                          <div key={r.id_receta} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{r.medicamento}</span>
                              {r.dosis && <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{r.dosis}</span>}
                              <span className="text-slate-500 dark:text-slate-400">• {r.frecuencia}</span>
                              <span className="text-slate-500 dark:text-slate-400">• {r.via_administracion}</span>
                            </div>
                            {r.instrucciones && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                                Indicaciones: {r.instrucciones}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(!selectedRecord.tratamientos || selectedRecord.tratamientos.length === 0) &&
                      (!selectedRecord.recetas || selectedRecord.recetas.length === 0) && (
                        <p className="text-slate-400 italic">Sin plan terapéutico registrado.</p>
                      )}
                  </div>
                </div>

                {/* Archivos Adjuntos */}
                {selectedRecord.archivos && selectedRecord.archivos.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      <FolderOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Evidencia Multimedia & Archivos ({selectedRecord.archivos.length})
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedRecord.archivos.map((a) => (
                        <a
                          key={a.id_archivo}
                          href={a.url_archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors block text-center"
                        >
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                            {a.nombre_archivo || 'Archivo'}
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Ver Archivo</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Impresión */}
      {isPrintModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-sm font-bold text-slate-900">Vista de Impresión & Exportación PDF</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handlePrintDocument} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)} className="text-xs">
                  Cerrar
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
              <MedicalRecordPrintView
                historia={selectedRecord}
                mascota={selectedRecord.mascota as any}
                signosVitales={selectedRecord.signos_vitales}
                diagnosticos={selectedRecord.diagnosticos}
                tratamientos={selectedRecord.tratamientos}
                recetas={selectedRecord.recetas}
                examenes={selectedRecord.examenes}
                veterinarianName={user?.nombre_completo || user?.email}
                clinicName={user?.veterinaria_nombre || 'Clínica Veterinaria VetBol'}
                licenseNumber={user?.matricula_profesional || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Paciente para Nueva Consulta */}
      <PatientSelectModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSelectPatient={handleSelectPatient}
      />
    </div>
  )
}
