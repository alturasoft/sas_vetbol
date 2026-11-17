import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { SubscriptionGuard } from '@/components/auth/SubscriptionGuard'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { LoadingScreen } from '@/components/common/LoadingScreen'

// Rutas Públicas y Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterClinicPage = lazy(() => import('@/pages/auth/RegisterClinicPage').then(m => ({ default: m.RegisterClinicPage })))
const SubscriptionPaywallPage = lazy(() => import('@/pages/suscripcion/SubscriptionPaywallPage').then(m => ({ default: m.SubscriptionPaywallPage })))

// Módulos Clínicos Principales
const DashboardOverviewPage = lazy(() => import('@/pages/dashboard/DashboardOverviewPage').then(m => ({ default: m.DashboardOverviewPage })))
const AppointmentsCalendarPage = lazy(() => import('@/pages/citas/AppointmentsCalendarPage').then(m => ({ default: m.AppointmentsCalendarPage })))
const ClientsListPage = lazy(() => import('@/pages/clientes/ClientsListPage').then(m => ({ default: m.ClientsListPage })))
const PatientsListPage = lazy(() => import('@/pages/pacientes/PatientsListPage').then(m => ({ default: m.PatientsListPage })))
const MedicalRecordsPage = lazy(() => import('@/pages/historia-clinica/MedicalRecordsPage').then(m => ({ default: m.MedicalRecordsPage })))
const ConsultationWizardPage = lazy(() => import('@/pages/historia-clinica/ConsultationWizardPage').then(m => ({ default: m.ConsultationWizardPage })))
const HospitalizationBoardPage = lazy(() => import('@/pages/hospitalizaciones/HospitalizationBoardPage').then(m => ({ default: m.HospitalizationBoardPage })))
const SurgeriesPage = lazy(() => import('@/pages/cirugias/SurgeriesPage').then(m => ({ default: m.SurgeriesPage })))

// Módulos Administrativos y Configuración
const ClinicSettingsPage = lazy(() => import('@/pages/configuracion/ClinicSettingsPage').then(m => ({ default: m.ClinicSettingsPage })))
const StaffManagementPage = lazy(() => import('@/pages/staff/StaffManagementPage').then(m => ({ default: m.StaffManagementPage })))
const TenantsManagementPage = lazy(() => import('@/pages/superadmin/TenantsManagementPage').then(m => ({ default: m.TenantsManagementPage })))
const PublicacionesPage = lazy(() => import('@/pages/publicaciones/PublicacionesPage').then(m => ({ default: m.PublicacionesPage })))
const VisorPermisosPage = lazy(() => import('@/pages/roles/VisorPermisosPage').then(m => ({ default: m.VisorPermisosPage })))
const RolesManagementPage = lazy(() => import('@/pages/roles/RolesManagementPage').then(m => ({ default: m.RolesManagementPage })))
const RolePermissionsPage = lazy(() => import('@/pages/roles/RolePermissionsPage').then(m => ({ default: m.RolePermissionsPage })))

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen message="Cargando módulo veterinario..." />}>
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterClinicPage />} />

      {/* Protected Clinic Operations (Requires Auth) */}
      <Route element={<ProtectedRoute />}>
        {/* Pantalla de Paywall cuando la suscripción de la clínica expiró */}
        <Route path="/suscripcion" element={<SubscriptionPaywallPage />} />

        {/* Protección Fail-Secure: sólo permite el paso si el tenant tiene suscripción vigente */}
        <Route element={<SubscriptionGuard />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardOverviewPage />} />
            
            {/* Citas y Agenda */}
            <Route
              path="/citas"
              element={
                <PermissionGuard permission="VER_CITAS">
                  <AppointmentsCalendarPage />
                </PermissionGuard>
              }
            />

            {/* Directorio de Clientes (Propietarios) */}
            <Route
              path="/clientes"
              element={
                <PermissionGuard permission="VER_CLIENTES">
                  <ClientsListPage />
                </PermissionGuard>
              }
            />

            {/* Pacientes y Mascotas */}
            <Route
              path="/pacientes"
              element={
                <PermissionGuard permission="VER_MASCOTAS">
                  <PatientsListPage />
                </PermissionGuard>
              }
            />

            {/* Historias Clínicas */}
            <Route
              path="/historia-clinica"
              element={
                <PermissionGuard permission="VER_HISTORIA_CLINICA">
                  <MedicalRecordsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/historia-clinica/nueva"
              element={
                <PermissionGuard permission="CREAR_CONSULTA">
                  <ConsultationWizardPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/historia-clinica/:idHistoria"
              element={
                <PermissionGuard permission="VER_HISTORIA_CLINICA">
                  <ConsultationWizardPage />
                </PermissionGuard>
              }
            />

            {/* Tablón de Anuncios y Noticias */}
            <Route
              path="/publicaciones"
              element={
                <PermissionGuard permission="VER_PUBLICACIONES">
                  <PublicacionesPage />
                </PermissionGuard>
              }
            />

            {/* Hospitalizaciones y Jaulas */}
            <Route
              path="/hospitalizaciones"
              element={
                <PermissionGuard permission={['VER_HISTORIA_CLINICA', 'HOSPITALIZACION_OP']}>
                  <HospitalizationBoardPage />
                </PermissionGuard>
              }
            />

            {/* Quirófano y Cirugías */}
            <Route
              path="/cirugias"
              element={
                <PermissionGuard permission={['VER_HISTORIA_CLINICA', 'CIRUGIA_OP']}>
                  <SurgeriesPage />
                </PermissionGuard>
              }
            />

            {/* Staff Médico y Personal */}
            <Route
              path="/staff"
              element={
                <PermissionGuard permission="ADMINISTRAR_USUARIOS">
                  <StaffManagementPage />
                </PermissionGuard>
              }
            />

            {/* Módulo de Roles y Permisos RBAC */}
            <Route
              path="/roles"
              element={
                <PermissionGuard permission="ADMINISTRAR_ROLES">
                  <RolesManagementPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/roles/permisos/:idRol"
              element={
                <PermissionGuard permission="ADMINISTRAR_ROLES">
                  <RolePermissionsPage />
                </PermissionGuard>
              }
            />

            {/* Visor de Diagnóstico: Mis Accesos y Permisos (Público para cualquier staff autenticado) */}
            <Route path="/visor-permisos" element={<VisorPermisosPage />} />

            {/* Configuración de la Clínica */}
            <Route
              path="/configuracion"
              element={
                <PermissionGuard permission={['CONFIGURACION_GENERAL', 'VER_INVENTARIO']}>
                  <ClinicSettingsPage />
                </PermissionGuard>
              }
            />

            {/* Rutas exclusivas del SuperAdmin SaaS */}
            <Route element={<RoleGuard allowedRoles={['superadmin']} />}>
              <Route path="/superadmin/tenants" element={<TenantsManagementPage />} />
              <Route path="/superadmin/usuarios" element={<TenantsManagementPage />} />
              <Route path="/superadmin/seguridad" element={<TenantsManagementPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  )
}
