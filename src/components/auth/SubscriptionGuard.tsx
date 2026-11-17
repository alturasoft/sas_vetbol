import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'

interface SubscriptionGuardProps {
  fallbackPath?: string
}

/**
 * Motor Fail-Secure de Suscripción SaaS (Sección 1.3 de ESPECIFICACION_SAAS_WEB.md)
 * Si la suscripción de la clínica no está activa o el período de prueba expiró,
 * redirige forzosamente a la pantalla de Paywall (/suscripcion).
 */
export function SubscriptionGuard({ fallbackPath = '/suscripcion' }: SubscriptionGuardProps) {
  const user = useAuthStore((state) => state.user)
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const location = useLocation()

  // Si el usuario es SuperAdmin, omite el paywall
  if (user?.role === 'superadmin' || user?.rol_codigo === 'SUPERADMIN') {
    return <Outlet />
  }

  // Evitar bucle infinito si ya se encuentra en /suscripcion
  if (location.pathname.startsWith('/suscripcion')) {
    return <Outlet />
  }

  const suscripcion = currentTenant?.suscripcion

  // Si no hay suscripción registrada o el tenant está suspendido/inactivo
  if (!suscripcion) {
    // Si en modo mock o dev no hay suscripción, permitimos continuar salvo que status sea inactivo
    if (currentTenant?.status === 'suspended' || (currentTenant?.status as any) === 'inactive') {
      return <Navigate to={fallbackPath} replace />
    }

    return <Outlet />
  }

  const now = new Date()

  // 1. Estados bloqueantes directos
  if (['past_due', 'canceled', 'expired', 'suspended'].includes(suscripcion.estado)) {
    return <Navigate to={fallbackPath} replace />
  }

  // 2. Verificación de período de prueba (trial)
  if (suscripcion.estado === 'trial' && suscripcion.fecha_vencimiento_trial) {
    const trialEnd = new Date(suscripcion.fecha_vencimiento_trial)
    if (now > trialEnd) {
      return <Navigate to={fallbackPath} replace />
    }
  }

  // 3. Verificación de fecha de próximo vencimiento en planes activos
  if (suscripcion.estado === 'active' && suscripcion.fecha_proximo_vencimiento) {
    const nextDue = new Date(suscripcion.fecha_proximo_vencimiento)
    if (now > nextDue) {
      return <Navigate to={fallbackPath} replace />
    }
  }

  return <Outlet />
}
