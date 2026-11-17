import type { TipoPublicacion } from '@/types/publicacion'
import {
  Tag,
  Lightbulb,
  Syringe,
  AlertTriangle,
  Calendar,
  Sparkles,
  BookOpen,
  Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PublicacionBadgeProps {
  tipo: TipoPublicacion
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const TIPO_PUBLICACION_CONFIG: Record<
  TipoPublicacion,
  {
    label: string
    icon: typeof Megaphone
    badgeClass: string
    borderClass: string
    dotClass: string
  }
> = {
  PROMOCION: {
    label: 'Promoción',
    icon: Sparkles,
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-500',
  },
  CONSEJO: {
    label: 'Consejo',
    icon: Lightbulb,
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  VACUNA: {
    label: 'Campaña Vacuna',
    icon: Syringe,
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    borderClass: 'border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500',
  },
  ALERTA: {
    label: 'Alerta Sanitaria',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  EVENTO: {
    label: 'Evento',
    icon: Calendar,
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800',
    dotClass: 'bg-purple-500',
  },
  NUEVO_SERVICIO: {
    label: 'Nuevo Servicio',
    icon: Tag,
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
    borderClass: 'border-fuchsia-200 dark:border-fuchsia-800',
    dotClass: 'bg-fuchsia-500',
  },
  EDUCATIVO: {
    label: 'Educativo',
    icon: BookOpen,
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    dotClass: 'bg-indigo-500',
  },
  ANUNCIO: {
    label: 'Aviso General',
    icon: Megaphone,
    badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    borderClass: 'border-teal-200 dark:border-teal-800',
    dotClass: 'bg-teal-500',
  },
}

export function PublicacionBadge({ tipo, size = 'md', className }: PublicacionBadgeProps) {
  const config = TIPO_PUBLICACION_CONFIG[tipo] || TIPO_PUBLICACION_CONFIG.ANUNCIO
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border border-transparent shadow-xs transition-colors',
        config.badgeClass,
        config.borderClass,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn('shrink-0', iconSizes[size])} />
      <span>{config.label}</span>
    </span>
  )
}
