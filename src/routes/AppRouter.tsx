import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { SubscriptionGuard } from '@/components/auth/SubscriptionGuard'
import { PermissionGuard } from '@/components/auth/PermissionGuard'

import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterClinicPage } from '@/pages/auth/RegisterClinicPage'
import { SubscriptionPaywallPage } from '@/pages/suscripcion/SubscriptionPaywallPage'
import { DashboardOverviewPage } from '@/pages/dashboard/DashboardOverviewPage'
import { AppointmentsCalendarPage } from '@/pages/citas/AppointmentsCalendarPage'
import { ClientsListPage } from '@/pages/clientes/ClientsListPage'
import { PatientsListPage } from '@/pages/pacientes/PatientsListPage'
import { MedicalRecordsPage } from '@/pages/historia-clinica/MedicalRecordsPage'
import { ConsultationWizardPage } from '@/pages/historia-clinica/ConsultationWizardPage'
import { HospitalizationBoardPage } from '@/pages/hospitalizaciones/HospitalizationBoardPage'
import { SurgeriesPage } from '@/pages/cirugias/SurgeriesPage'
import { ClinicSettingsPage } from '@/pages/configuracion/ClinicSettingsPage'
import { StaffManagementPage } from '@/pages/staff/StaffManagementPage'
import { TenantsManagementPage } from '@/pages/superadmin/TenantsManagementPage'
import { PublicacionesPage } from '@/pages/publicaciones/PublicacionesPage'
import { VisorPermisosPage } from '@/pages/roles/VisorPermisosPage'
import { RolesManagementPage } from '@/pages/roles/RolesManagementPage'
import { RolePermissionsPage } from '@/pages/roles/RolePermissionsPage'

export function AppRouter() {
  return (
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
  )
}
