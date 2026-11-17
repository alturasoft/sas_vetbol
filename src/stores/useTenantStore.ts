import { create } from 'zustand'
import type { Tenant } from '@/types/tenant.types'
import { supabase } from '@/config/supabase'

interface TenantStore {
  currentTenant: Tenant | null
  isLoading: boolean
  setCurrentTenant: (tenant: Tenant | null) => void
  setLoading: (isLoading: boolean) => void
  fetchTenant: (id_veterinaria: number) => Promise<Tenant | null>
}

export const useTenantStore = create<TenantStore>((set) => ({
  currentTenant: null,
  isLoading: false,

  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchTenant: async (id_veterinaria: number) => {
    try {
      set({ isLoading: true })
      const { data: vet } = await supabase
        .from('veterinarias')
        .select('*')
        .eq('id_veterinaria', id_veterinaria)
        .maybeSingle()

      if (!vet) {
        set({ isLoading: false })
        return null
      }

      const { data: sub } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('id_entidad', String(id_veterinaria))
        .maybeSingle()

      const tenant: Tenant = {
        id: String(vet.id_veterinaria),
        id_veterinaria: vet.id_veterinaria,
        name: vet.nombre,
        slug: vet.nombre.toLowerCase().replace(/\s+/g, '-'),
        phone: vet.telefono,
        email: vet.email,
        address: vet.direccion,
        city: vet.zona,
        country: 'Bolivia',
        status: sub?.estado || 'active',
        suscripcion: sub,
        created_at: vet.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      set({ currentTenant: tenant, isLoading: false })
      return tenant
    } catch (err) {
      console.error('Error al cargar tenant:', err)
      set({ isLoading: false })
      return null
    }
  },
}))
