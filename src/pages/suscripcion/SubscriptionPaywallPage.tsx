import { AlertTriangle, Clock, ShieldAlert, Phone, Mail, LogOut, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { formatDate } from '@/lib/utils'

export function SubscriptionPaywallPage() {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const suscripcion = currentTenant?.suscripcion
  const isTrial = suscripcion?.estado === 'trial'
  const isPastDue = suscripcion?.estado === 'past_due'
  const isExpired = suscripcion?.estado === 'expired' || suscripcion?.estado === 'canceled'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container principal con espaciado en múltiplos de 4 */}
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Banner de alerta de seguridad */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Acceso Operativo Restringido (Paywall Fail-Secure)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              El período de suscripción de la clínica <span className="font-semibold text-slate-800">{currentTenant?.name || 'su veterinaria'}</span> ha vencido o requiere regularización administrativa.
            </p>
          </div>
        </div>

        {/* Tarjeta de estado de cuenta */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="p-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Estado de Suscripción de la Clínica
                </CardTitle>
                <CardDescription className="text-slate-500 mt-1">
                  Tenant ID: {currentTenant?.id_veterinaria || user?.id_veterinaria || 'N/A'} — {currentTenant?.name}
                </CardDescription>
              </div>
              <Badge 
                variant={isPastDue || isExpired ? 'destructive' : 'warning'} 
                className="px-3 py-1 text-xs font-semibold self-start sm:self-auto uppercase tracking-wider"
              >

                {suscripcion?.estado ? `ESTADO: ${suscripcion.estado}` : 'SUSCRIPCIÓN INACTIVA'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 space-y-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Modalidad de Plan
                </span>
                <p className="text-base font-semibold text-slate-800 capitalize">
                  {suscripcion?.temporalidad ? `${suscripcion.temporalidad}` : 'Plan Profesional Estándar'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 space-y-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {isTrial ? 'Vencimiento Período de Prueba' : 'Fecha de Vencimiento'}
                </span>
                <p className="text-base font-semibold text-slate-800">
                  {formatDate(suscripcion?.fecha_vencimiento_trial || suscripcion?.fecha_proximo_vencimiento)}
                </p>
              </div>
            </div>

            {/* Opciones de regularización administrativa */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ¿Cómo reactivar el acceso de su veterinaria?
              </h3>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>
                    Contacte a la administración de <strong>VetBol SaaS</strong> para activar su plan mensual o anual.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>
                    El SuperAdministrador puede renovar o conceder días de gracia desde el panel de control.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>
                    Sus historias clínicas, pacientes y expedientes se encuentran respaldados de forma segura.
                  </span>
                </div>
              </div>
            </div>

            {/* Canales de atención */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-emerald-900">
                  Canal de Soporte y Facturación
                </h4>
                <p className="text-xs text-emerald-700">
                  Atención directa para clínicas veterinarias en Bolivia
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://wa.me/59170012345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp Directo
                </a>
                <a
                  href="mailto:soporte@vetbolivia.com"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email Soporte
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones de pie */}
        <div className="flex justify-between items-center px-2">
          <span className="text-xs text-slate-400">
            Usuario activo: {user?.nombre_completo || user?.full_name} ({user?.email})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-slate-500 hover:text-rose-600 gap-2 text-xs"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>

      </div>
    </div>
  )
}
