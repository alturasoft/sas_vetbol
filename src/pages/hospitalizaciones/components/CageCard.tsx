import React from 'react'
import {
  BedDouble,
  Clock,
  User,
  HeartPulse,
  Activity,
  Plus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import type { Hospitalizacion } from '@/types/hospitalizacion.types'

interface CageCardProps {
  cageName: string
  admission?: Hospitalizacion | null
  canManage?: boolean
  onSelectAdmission: (admission: Hospitalizacion) => void
  onAssignPatient: (cageName: string) => void
  onDischargeClick: (admission: Hospitalizacion) => void
}

export const CageCard: React.FC<CageCardProps> = ({
  cageName,
  admission,
  canManage = true,
  onSelectAdmission,
  onAssignPatient,
  onDischargeClick,
}) => {
  if (!admission) {
    // Jaula / Canil Libre
    return (
      <Card className="border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 transition-all group flex flex-col justify-between p-4 min-h-[200px]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-400 group-hover:text-amber-600 transition-colors">
            {cageName}
          </span>
          <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
            Libre
          </Badge>
        </div>

        <div className="py-4 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/40 flex items-center justify-center transition-colors">
            <BedDouble className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
            Jaula Disponible
          </p>
          <p className="text-[11px] text-slate-400">Sin paciente asignado</p>
        </div>

        {canManage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAssignPatient(cageName)}
            className="w-full text-xs gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 group-hover:border-amber-500 group-hover:text-amber-600"
          >
            <Plus className="w-3.5 h-3.5" />
            Asignar Paciente
          </Button>
        )}
      </Card>
    )
  }

  // Jaula Ocupada
  const pet = admission.mascota
  const client = pet?.cliente

  const calculateDays = () => {
    const start = new Date(admission.fecha_ingreso).getTime()
    const diffDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((Date.now() - start) / (1000 * 60 * 60))
    if (diffDays <= 0) {
      return `${Math.max(1, diffHours)}h internado`
    }
    return `${diffDays} ${diffDays === 1 ? 'día' : 'días'} internado`
  }

  return (
    <Card
      onClick={() => onSelectAdmission(admission)}
      className="border border-amber-200/90 dark:border-amber-900/60 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
    >
      <div className="p-4 border-b border-amber-100 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
            <BedDouble className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
            {admission.habitacion || cageName}
          </span>
        </div>
        <Badge className="bg-amber-500 text-white text-[10px] font-semibold">
          {calculateDays()}
        </Badge>
      </div>

      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-center gap-3">
          <Avatar
            src={pet?.foto_url}
            fallback={pet?.nombre || 'VET'}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 transition-colors">
              {pet?.nombre}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              {pet?.especie} {pet?.raza ? `• ${pet.raza}` : ''}
            </p>
          </div>
        </div>

        <div className="text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-1">
          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
            Motivo de Ingreso:
          </p>
          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
            {admission.motivo_ingreso}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Tutor: {client?.nombres || 'Sin tutor'}</span>
          {client?.telefono && <span>Tel: {client.telefono}</span>}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onSelectAdmission(admission)
          }}
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 hover:bg-amber-100/50 p-1.5 h-auto gap-1"
        >
          Evolución <ArrowRight className="w-3.5 h-3.5" />
        </Button>

        {canManage && (
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDischargeClick(admission)
            }}
            className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 px-2.5 h-auto rounded-md shadow-xs gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Alta
          </Button>
        )}
      </div>
    </Card>
  )
}
