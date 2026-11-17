import { useState } from 'react'
import {
  CheckCircle2,
  Printer,
  FileCheck,
  Lock,
  ArrowLeft,
  Dog,
  List,
  AlertTriangle,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { MedicalRecordPrintView } from '../MedicalRecordPrintView'
import { useConsultationWizardStore } from '@/stores/useConsultationWizardStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { printDocument } from '@/utils/printDocument'

export function Paso8Finalizacion() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    historiaCreada,
    mascota,
    signosVitales,
    diagnosticos,
    tratamientos,
    recetas,
    examenes,
    finalizarConsulta,
    setStep,
    isSaving,
    error,
  } = useConsultationWizardStore()

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const isClosed = historiaCreada?.estado === 'CERRADA'

  const handleFinalize = async () => {
    const success = await finalizarConsulta()
    if (success) {
      setIsConfirmOpen(false)
    }
  }

  const handlePrint = () => {
    if (!historiaCreada) return
    const docCode = historiaCreada.numero_historia || `HC-${historiaCreada.id_historia_clinica}`
    const petName = mascota?.nombre || 'Paciente'
    printDocument({
      target: 'medical-record-print-sheet',
      documentTitle: `Expediente_${petName}_${docCode}`,
      pageSize: 'letter',
      pageOrientation: 'portrait',
    })
  }

  if (!historiaCreada) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">No hay consulta activa para finalizar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card Superior de Estado y Acciones de Cierre */}
      <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isClosed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                }`}
              >
                {isClosed ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Paso 8: Auditoría, Cierre & Documento Oficial (PDF)
                </CardTitle>
                <CardDescription className="text-xs dark:text-slate-400">
                  Revisa el resumen integral antes de sellar el expediente médico y generar el PDF
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="gap-1.5 text-xs h-9 border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Imprimir / Guardar PDF</span>
              </Button>

              {!isClosed ? (
                <Button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-xs"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Finalizar Consulta (CERRAR)</span>
                </Button>
              ) : (
                <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Consulta Oficialmente CERRADA
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 print:p-0">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 mb-4 no-print">
              {error}
            </div>
          )}

          {/* Banner de Estado Informativo */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 mb-6 no-print ${
              isClosed
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isClosed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-bold block">
                  {isClosed
                    ? 'Expediente Clínico Finalizado y Sellado'
                    : 'La consulta se encuentra actualmente en estado ABIERTA'}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {isClosed
                    ? 'Esta consulta está cerrada conforme al protocolo médico. Su registro histórico queda auditado.'
                    : 'Puedes revisar el resumen o finalizarla para que el estado pase formalmente a CERRADA.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['medical-records'] })
                  navigate('/historia-clinica')
                }}
                className="text-xs gap-1 h-8 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <List className="w-3.5 h-3.5" />
                <span>Ir al Listado</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/pacientes')}
                className="text-xs gap-1 h-8 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Dog className="w-3.5 h-3.5" />
                <span>Perfil Paciente</span>
              </Button>
            </div>
          </div>

          {/* Vista previa de documento oficial lista para impresión */}
          <div className="bg-slate-100/70 dark:bg-slate-950/60 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 print:bg-transparent print:p-0 print:border-none">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400 font-semibold no-print">
              <span>Vista previa del documento médico legal oficial:</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Optimizado para hoja tamaño Carta / A4
              </span>
            </div>

            <MedicalRecordPrintView
              historia={historiaCreada}
              mascota={mascota}
              signosVitales={signosVitales}
              diagnosticos={diagnosticos}
              tratamientos={tratamientos}
              recetas={recetas}
              examenes={examenes}
              veterinarianName={user?.nombre_completo || user?.email}
              clinicName={user?.veterinaria_nombre || 'Clínica Veterinaria VetBol'}
              licenseNumber={user?.matricula_profesional || undefined}
            />
          </div>

          {/* Navegación al final */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 no-print">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(7)}
              className="gap-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Archivos</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="gap-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Imprimir Hoja Clínica</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación para Cerrar Consulta */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        variant="primary"
        title="Finalizar y Cerrar Consulta Médica"
        description="¿Confirmas que deseas cerrar definitivamente esta atención? El estado pasará a CERRADA y el expediente quedará formalmente asentado."
        confirmText="Confirmar y Cerrar"
        cancelText="Revisar de nuevo"
        isLoading={isSaving}
        onConfirm={handleFinalize}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
