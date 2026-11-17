import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PawPrint, Building2, User, Mail, Lock, Phone, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTenantStore } from '@/stores/useTenantStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export function RegisterClinicPage() {
  const navigate = useNavigate()
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant)
  const loginWithMock = useAuthStore((state) => state.loginWithMock)

  const [clinicName, setClinicName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      const slug = clinicName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
      const newTenant = {
        id: slug,
        name: clinicName,
        slug,
        owner_name: adminName,
        email,
        phone,
        city,
        country: 'Bolivia',
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setCurrentTenant(newTenant)
      loginWithMock('clinic_admin')
      setIsSubmitting(false)
      navigate('/dashboard')
    }, 600)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-150">
      {/* Botón flotante de cambio de tema */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg space-y-6 my-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <PawPrint className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            VetBol<span className="text-emerald-600 dark:text-emerald-400">SaaS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Empieza a gestionar tu clínica veterinaria hoy mismo. Aprovisionamiento directo sin comisiones ni pasarelas externas.
          </p>
        </div>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Registrar Nueva Clínica</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Configura los datos del centro veterinario y tu cuenta de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Aprovisionamiento instantáneo:</strong> Tu clínica se creará con aislamiento completo de base de datos PostgreSQL y políticas de seguridad RLS.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre de la Clínica Veterinaria</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Ej. Veterinaria San Roque"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ciudad / Municipio</label>
                  <Input
                    placeholder="Ej. Santa Cruz, La Paz, Cochabamba"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Teléfono / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      placeholder="+591 70000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre del Médico / Administrador</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    placeholder="Dr. / Dra. Nombre Completo"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Correo Electrónico Oficial</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    type="email"
                    placeholder="admin@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contraseña Segura</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    type="password"
                    placeholder="Al menos 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? 'Creando Clínica...' : 'Crear Cuenta y Comenzar'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-0 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ¿Tu clínica ya tiene cuenta?{' '}
              <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Inicia Sesión aquí
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
