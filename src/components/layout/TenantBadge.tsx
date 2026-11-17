import { Building2 } from 'lucide-react'
import { useTenantStore } from '@/stores/useTenantStore'

export function TenantBadge() {
  const currentTenant = useTenantStore((state) => state.currentTenant)

  if (!currentTenant) return null

  const isTrial = currentTenant.suscripcion?.estado === 'trial'

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 shadow-2xs">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs mt-0.5">
        <Building2 className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0 flex-1 text-left">
        <span
          title={currentTenant.name}
          className="text-xs font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-100 break-words"
        >
          {currentTenant.name}
        </span>
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isTrial ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize truncate">
              {currentTenant.suscripcion?.estado ? `Plan ${currentTenant.suscripcion.estado}` : currentTenant.city || 'Bolivia'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
            ID:{currentTenant.id_veterinaria || currentTenant.id}
          </span>
        </div>
      </div>
    </div>
  )
}
