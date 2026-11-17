import { useState } from 'react'
import { Building2, Plus, Search, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Tenant } from '@/types/tenant.types'

const MOCK_ALL_TENANTS: Tenant[] = [
  {
    id: 'ten-1',
    name: 'Clínica Veterinaria San Roque',
    slug: 'san-roque-scz',
    legal_name: 'Veterinaria San Roque S.R.L.',
    tax_id: '1029384756',
    phone: '+591 3 3345678',
    email: 'contacto@sanroquevet.com',
    city: 'Santa Cruz de la Sierra',
    country: 'Bolivia',
    status: 'active',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-09-10T00:00:00Z',
  },
  {
    id: 'ten-2',
    name: 'Hospital Veterinario El Prado',
    slug: 'el-prado-lpz',
    legal_name: 'Vet El Prado S.A.',
    tax_id: '2039485761',
    phone: '+591 2 2441122',
    email: 'info@vetelprado.com',
    city: 'La Paz',
    country: 'Bolivia',
    status: 'active',
    created_at: '2026-03-20T00:00:00Z',
    updated_at: '2026-09-05T00:00:00Z',
  },
  {
    id: 'ten-3',
    name: 'Consultorio PetCare Cochabamba',
    slug: 'petcare-cbba',
    legal_name: 'PetCare Bolivia Unipersonal',
    tax_id: '3049586712',
    phone: '+591 4 4556677',
    email: 'dr.petcare@gmail.com',
    city: 'Cochabamba',
    country: 'Bolivia',
    status: 'trial',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
]

export function TenantsManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_ALL_TENANTS)
  const [search, setSearch] = useState('')

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.city?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'active' ? 'suspended' : 'active'
          return { ...t, status: nextStatus }
        }
        return t
      })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            Gestión Global de Clínicas (Tenants)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Panel exclusivo de Super-Administrador para aprovisionamiento y control de clínicas en la plataforma
          </p>
        </div>

        <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-4 h-4" />
          Aprovisionar Clínica
        </Button>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar clínica por nombre, ciudad o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs dark:bg-slate-950/50 dark:border-slate-800 dark:text-slate-100"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
              <TableHead className="dark:text-slate-300">Clínica</TableHead>
              <TableHead className="dark:text-slate-300">Ciudad</TableHead>
              <TableHead className="dark:text-slate-300">Contacto</TableHead>
              <TableHead className="dark:text-slate-300">Estado</TableHead>
              <TableHead className="dark:text-slate-300">Fecha Alta</TableHead>
              <TableHead className="text-right dark:text-slate-300">Control de Acceso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((tenant) => (
              <TableRow key={tenant.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                <TableCell>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">{tenant.name}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{tenant.slug}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-700 dark:text-slate-300">{tenant.city}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block">{tenant.email}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{tenant.phone}</span>
                </TableCell>
                <TableCell>
                  {tenant.status === 'active' && <Badge variant="success">Activa</Badge>}
                  {tenant.status === 'trial' && <Badge variant="warning">Prueba</Badge>}
                  {tenant.status === 'suspended' && <Badge variant="destructive">Suspendida</Badge>}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(tenant.id)}
                    className={`h-8 text-xs ${
                      tenant.status === 'active'
                        ? 'text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                        : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    {tenant.status === 'active' ? 'Suspender' : 'Activar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
