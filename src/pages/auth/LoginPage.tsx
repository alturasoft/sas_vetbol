import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PawPrint, Lock, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/useAuthStore'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export function LoginPage() {
  const navigate = useNavigate()
  const { signInWithPassword, isAuthenticated, isLoading, user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Si ya existe una sesión autenticada válida, redirigir automáticamente al dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await signInWithPassword(email.trim(), password)

      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión. Verifica tus credenciales.')
        return
      }

      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-150">
      {/* Botón flotante de cambio de tema */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <PawPrint className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            VetBol<span className="text-emerald-600 dark:text-emerald-400">SaaS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Software de Gestión Integral para Clínicas y Consultorios Veterinarios
          </p>
        </div>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Iniciar Sesión</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para acceder a tu centro veterinario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    type="email"
                    placeholder="doctor@veterinaria.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
                  <a href="#" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">¿Olvidaste?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Entrar a la Clínica
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-0 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ¿No tienes cuenta aún?{' '}
              <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Registra tu Clínica
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Aislamiento multi-tenant con Supabase Row Level Security</span>
        </div>
      </div>
    </div>
  )
}
