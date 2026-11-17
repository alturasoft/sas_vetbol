import { useState } from 'react'
import { Building2, Save, CheckCircle, ShieldCheck, Mail, Phone, MapPin, Sun, Moon, Laptop, Palette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ActionGuard } from '@/components/auth/ActionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from '@/stores/useToastStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useThemeStore, ThemeMode } from '@/stores/useThemeStore'
import { cn } from '@/lib/utils'

export function ClinicSettingsPage() {
  const { currentTenant, setCurrentTenant } = useTenantStore()
  const { theme, setTheme } = useThemeStore()
  const { hasPermission } = usePermissions()

  const [name, setName] = useState(currentTenant?.name || '')
  const [legalName, setLegalName] = useState(currentTenant?.legal_name || '')
  const [taxId, setTaxId] = useState(currentTenant?.tax_id || '')
  const [phone, setPhone] = useState(currentTenant?.phone || '')
  const [email, setEmail] = useState(currentTenant?.email || '')
  const [address, setAddress] = useState(currentTenant?.address || '')
  const [city, setCity] = useState(currentTenant?.city || '')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPermission('CONFIGURACION_GENERAL')) {
      toast.error('No tienes permisos para modificar la configuración de la clínica.')
      return
    }
    if (currentTenant) {
      setCurrentTenant({
        ...currentTenant,
        name,
        legal_name: legalName,
        tax_id: taxId,
        phone,
        email,
        address,
        city,
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    }
  }

  const themeCards: { mode: ThemeMode; label: string; desc: string; icon: typeof Sun }[] = [
    {
      mode: 'light',
      label: 'Tema Claro',
      desc: 'Superficies blancas limpias con contraste nítido diurno',
      icon: Sun,
    },
    {
      mode: 'dark',
      label: 'Tema Oscuro',
      desc: 'Tonos Slate profundos que reducen el cansancio visual',
      icon: Moon,
    },
    {
      mode: 'system',
      label: 'Seguir Sistema',
      desc: 'Se adapta automáticamente a la configuración del dispositivo',
      icon: Laptop,
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          Configuración de la Clínica
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Administra la información comercial, datos de facturación e identidad del establecimiento
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Los datos de la clínica han sido actualizados con éxito en la base de datos.
        </div>
      )}

      {/* Selector de Apariencia del Sistema */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold">Apariencia y Modo Visual</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Selecciona el tema preferido para tu estación de trabajo en la clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeCards.map((t) => {
              const Icon = t.icon
              const isSelected = theme === t.mode
              return (
                <button
                  key={t.mode}
                  type="button"
                  onClick={() => setTheme(t.mode)}
                  className={cn(
                    'flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer',
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white dark:border-slate-800 dark:hover:border-slate-700 dark:bg-slate-900/60'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        Activo
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {t.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold">Datos Generales</CardTitle>
            <CardDescription className="text-xs">
              Nombre visible para clientes, recetas y citas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre de Fantasía</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Razón Social</label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">NIT / Identificación Tributaria</label>
                <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ciudad / Departamento</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold">Información de Contacto y Ubicación</CardTitle>
            <CardDescription className="text-xs">
              Canales oficiales de comunicación con propietarios de pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Teléfono / WhatsApp de Urgencias</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email de Notificaciones</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dirección Física</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <ActionGuard permission="CONFIGURACION_GENERAL">
            <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </Button>
          </ActionGuard>
        </div>
      </form>
    </div>
  )
}
