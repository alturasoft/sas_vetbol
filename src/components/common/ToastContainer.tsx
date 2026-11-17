import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore } from '@/stores/useToastStore'

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success'
        const isError = t.type === 'error'
        const isWarning = t.type === 'warning'

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all animate-in slide-in-from-bottom-5 duration-200 bg-white dark:bg-slate-900 ${
              isSuccess
                ? 'border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                : isError
                ? 'border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-100'
                : isWarning
                ? 'border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-100'
                : 'border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              {t.title && <h5 className="text-xs font-bold leading-tight">{t.title}</h5>}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
