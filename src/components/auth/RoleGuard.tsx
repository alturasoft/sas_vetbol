import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import type { UserRole } from '@/types/auth.types'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export function RoleGuard({ allowedRoles, fallbackPath = '/dashboard' }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user)

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <Outlet />
}
