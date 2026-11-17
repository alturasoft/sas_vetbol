import {
  FileText,
  Activity,
  Stethoscope,
  Pill,
  ClipboardList,
  FlaskConical,
  FolderOpen,
  CheckCircle2,
  Lock,
} from 'lucide-react'

interface WizardStepperProps {
  currentStep: number
  maxStepReached: number
  isBlockedEPC?: boolean
  hasHeaderCreated: boolean
  onSelectStep: (stepNumber: number) => void
}

const STEPS = [
  { id: 1, label: 'Motivo', sub: 'S - Subjetivo', icon: FileText },
  { id: 2, label: 'Signos Vitales', sub: 'O - Fisiológico', icon: Activity },
  { id: 3, label: 'Diagnósticos', sub: 'A - Análisis', icon: Stethoscope },
  { id: 4, label: 'Tratamientos', sub: 'P - Plan Clínico', icon: ClipboardList },
  { id: 5, label: 'Recetas', sub: 'P - Farmacia', icon: Pill },
  { id: 6, label: 'Exámenes', sub: 'O - Laboratorio', icon: FlaskConical },
  { id: 7, label: 'Archivos', sub: 'Multimedia', icon: FolderOpen },
  { id: 8, label: 'Cierre', sub: 'Auditoría & PDF', icon: CheckCircle2 },
]

export function WizardStepper({
  currentStep,
  maxStepReached,
  isBlockedEPC = false,
  hasHeaderCreated,
  onSelectStep,
}: WizardStepperProps) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {STEPS.map((step) => {
          const isCurrent = currentStep === step.id
          const isCompleted = step.id < currentStep || (step.id <= maxStepReached && step.id !== currentStep)
          const isLocked = isBlockedEPC || (step.id > 1 && !hasHeaderCreated)
          const Icon = step.icon

          return (
            <button
              key={step.id}
              type="button"
              disabled={isLocked}
              onClick={() => onSelectStep(step.id)}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-all text-xs select-none ${
                isCurrent
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20 ring-2 ring-emerald-600/30'
                  : isLocked
                  ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-100 dark:border-slate-800/50'
                  : isCompleted
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 font-medium'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                ) : isCompleted && !isCurrent ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                )}
                <span className={`text-[10px] font-bold ${isCurrent ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                  {step.id}
                </span>
              </div>

              <span className="font-semibold text-xs leading-tight truncate w-full px-1">
                {step.label}
              </span>
              <span
                className={`text-[9px] mt-0.5 truncate w-full px-1 ${
                  isCurrent ? 'text-emerald-100 font-normal' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.sub}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
