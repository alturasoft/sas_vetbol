import {
  LayoutDashboard,
  Calendar,
  Dog,
  Users,
  FileText,
  BedDouble,
  Scissors,
  Settings,
  ShieldCheck,
  KeyRound,
  Building2,
  CreditCard,
  BellRing,
  UserCheck,
  Megaphone,
} from 'lucide-react'
import type { UserRole, PermisoCodigo } from '@/types/auth.types'

export interface NavItem {
  title: string
  href: string
  icon: typeof LayoutDashboard
  roles?: UserRole[]
  permission?: PermisoCodigo
  badge?: string
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Citas y Agenda',
    href: '/citas',
    icon: Calendar,
    permission: 'VER_CITAS',
  },
  {
    title: 'Clientes (Propietarios)',
    href: '/clientes',
    icon: Users,
    permission: 'VER_CLIENTES',
  },
  {
    title: 'Pacientes y Mascotas',
    href: '/pacientes',
    icon: Dog,
    permission: 'VER_MASCOTAS',
  },
  {
    title: 'Historias Clínicas',
    href: '/historia-clinica',
    icon: FileText,
    permission: 'VER_HISTORIA_CLINICA',
  },
  {
    title: 'Tablón de Anuncios',
    href: '/publicaciones',
    icon: Megaphone,
    permission: 'VER_PUBLICACIONES',
  },
  {
    title: 'Hospitalización (Jaulas)',
    href: '/hospitalizaciones',
    icon: BedDouble,
    permission: 'HOSPITALIZACION_OP',
  },
  {
    title: 'Quirófano y Cirugías',
    href: '/cirugias',
    icon: Scissors,
    permission: 'CIRUGIA_OP',
  },
  {
    title: 'Staff y Personal',
    href: '/staff',
    icon: UserCheck,
    permission: 'ADMINISTRAR_USUARIOS',
  },
  {
    title: 'Roles y Accesos',
    href: '/roles',
    icon: ShieldCheck,
    permission: 'ADMINISTRAR_ROLES',
  },
  {
    title: 'Mis Accesos y Permisos',
    href: '/visor-permisos',
    icon: KeyRound,
  },
  {
    title: 'Configuración Clínica',
    href: '/configuracion',
    icon: Settings,
    permission: 'CONFIGURACION_GENERAL',
  },
  {
    title: 'Suscripción y Plan',
    href: '/suscripcion',
    icon: CreditCard,
    roles: ['superadmin', 'clinic_admin'],
  },
]

export const SUPERADMIN_NAVIGATION: NavItem[] = [
  {
    title: 'Clínicas / Tenants',
    href: '/superadmin/tenants',
    icon: Building2,
    permission: 'TENANT_MANAGEMENT',
    roles: ['superadmin'],
  },
  {
    title: 'Usuarios Globales',
    href: '/superadmin/usuarios',
    icon: Users,
    permission: 'TENANT_MANAGEMENT',
    roles: ['superadmin'],
  },
  {
    title: 'Auditoría y Notificaciones',
    href: '/superadmin/seguridad',
    icon: BellRing,
    permission: 'TENANT_MANAGEMENT',
    roles: ['superadmin'],
  },
]
