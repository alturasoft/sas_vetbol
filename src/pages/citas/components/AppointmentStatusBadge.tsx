import React from 'react'
import { Badge } from '@/components/ui/badge'

interface AppointmentStatusBadgeProps {
  status: string
  className?: string
}

export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || '').toUpperCase()

  if (normalized === 'CONFIRMADA' || normalized === 'CONFIRMED') {
    return (
      <Badge variant="success" className={`font-semibold ${className}`}>
        Confirmada
      </Badge>
    )
  }

  if (normalized === 'EN_PROCESO' || normalized === 'IN_PROGRESS') {
    return (
      <Badge variant="warning" className={`font-semibold ${className}`}>
        En Consulta
      </Badge>
    )
  }

  if (normalized === 'COMPLETADA' || normalized === 'COMPLETED') {
    return (
      <Badge variant="secondary" className={`font-semibold ${className}`}>
        Completada
      </Badge>
    )
  }

  if (normalized === 'CANCELADA' || normalized === 'CANCELLED') {
    return (
      <Badge variant="destructive" className={`font-semibold ${className}`}>
        Cancelada
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`font-semibold text-slate-700 bg-slate-50 border-slate-200 ${className}`}>
      Programada
    </Badge>
  )
}
