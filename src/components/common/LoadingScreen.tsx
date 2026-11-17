import { Loader2, PawPrint } from 'lucide-react'

export function LoadingScreen({ message = 'Cargando VetBol...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
          <PawPrint className="w-7 h-7 animate-pulse" />
        </div>
        <Loader2 className="absolute -bottom-2 -right-2 w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
    </div>
  )
}
