import { create } from 'zustand'
import type { UserProfile, UserRole } from '@/types/auth.types'
import { supabase, supabasePublic } from '@/config/supabase'
import { useTenantStore } from './useTenantStore'
import { mapDatabaseRoleToUserRole, getDefaultPermissionsForRole, setAuthStoreGetter } from '@/lib/permissions'

interface AuthStore {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (isLoading: boolean) => void
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loadUserProfile: (authUserId: string, authEmail?: string) => Promise<boolean>
  refreshPermissions: () => Promise<void>
  initAuth: () => Promise<void>
  signOut: () => Promise<void>
  loginWithMock: (role?: UserRole) => void
}

let authListenerRegistered = false

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Inicia en true para que ProtectedRoute espere la validación de sesión de Supabase

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  loadUserProfile: async (authUserId: string, authEmail?: string): Promise<boolean> => {
    try {
      set({ isLoading: true })

      // 1. Buscar en personal de veterinaria por user_id de auth
      let { data: staff, error: staffErr } = await supabase
        .from('personal')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle()

      // Si no se encuentra por user_id y disponemos de email, buscar por email
      if (!staff && authEmail) {
        const { data: staffByEmail } = await supabase
          .from('personal')
          .select('*')
          .ilike('email', authEmail.trim())
          .maybeSingle()

        if (staffByEmail) {
          staff = staffByEmail
          // Si el registro de personal no tenía vinculado el user_id, vincularlo
          if (!staffByEmail.user_id) {
            await supabase
              .from('personal')
              .update({ user_id: authUserId })
              .eq('id_persona', staffByEmail.id_persona)
          }
        }
      }

      if (staff) {
        // 2. Cargar datos de la clínica inquilina desde la tabla veterinarias
        const { data: vet } = await supabase
          .from('veterinarias')
          .select('*')
          .eq('id_veterinaria', staff.id_veterinaria)
          .maybeSingle()

        if (!vet) {
          console.error(`La veterinaria con ID ${staff.id_veterinaria} no existe en la base de datos.`)
          set({ user: null, isAuthenticated: false, isLoading: false })
          useTenantStore.getState().setCurrentTenant(null)
          return false
        }

        // 3. Cargar estado de suscripción de la clínica
        const { data: sub } = await supabase
          .from('suscripciones')
          .select('*')
          .eq('id_entidad', String(staff.id_veterinaria))
          .maybeSingle()

        // Sincronizar inquilino en useTenantStore
        useTenantStore.getState().setCurrentTenant({
          id: String(vet.id_veterinaria),
          id_veterinaria: vet.id_veterinaria,
          name: vet.nombre,
          slug: vet.nombre?.toLowerCase().replace(/\s+/g, '-') || `vet-${vet.id_veterinaria}`,
          phone: vet.telefono,
          email: vet.email,
          address: vet.direccion,
          city: vet.zona,
          country: 'Bolivia',
          status: sub?.estado || (vet.estado === 'VIG' ? 'active' : 'trial'),
          suscripcion: sub,
          created_at: vet.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        // 4. Identificación del rol RBAC y permisos mediante usuarios_roles + RPC get_mis_permisos
        let dbRole: string | null = staff.rol === 'PRO' ? 'ADMINISTRADOR' : null
        let explicitRoleAssigned = false
        let assignedRoleActive = true
        let assignedRoleId: number | null = null

        try {
          const { data: userRoleData } = await supabase
            .from('usuarios_roles')
            .select('id_rol, roles:roles(id_rol, nombre, activo)')
            .eq('id_persona', staff.id_persona)
            .maybeSingle()

          if (userRoleData?.roles && typeof userRoleData.roles === 'object') {
            const rObj = userRoleData.roles as any
            explicitRoleAssigned = true
            assignedRoleActive = rObj.activo !== false
            assignedRoleId = userRoleData.id_rol ? Number(userRoleData.id_rol) : null
            if (rObj.nombre) {
              dbRole = String(rObj.nombre).trim().toUpperCase()
            }
          }
        } catch {
          // Continuar con evaluación RPC
        }

        let rpcRoleName: string | null = null
        let rpcCodes: string[] | null = null

        try {
          const { data: rpcPermisos, error: rpcErr } = await supabasePublic.rpc('get_mis_permisos')
          if (!rpcErr && Array.isArray(rpcPermisos) && rpcPermisos.length > 0) {
            const firstRow = rpcPermisos[0] as any
            if (firstRow?.rol_nombre) {
              rpcRoleName = String(firstRow.rol_nombre).trim().toUpperCase()
            }
            if (Array.isArray(firstRow?.permisos_codigos)) {
              rpcCodes = firstRow.permisos_codigos.filter(Boolean)
            } else {
              const flat = rpcPermisos
                .flatMap((p: any) => p.permisos_codigos || [p.permiso_codigo || p])
                .filter((x: any) => typeof x === 'string')
              if (flat.length > 0) rpcCodes = flat
            }
          }
        } catch {
          // Fallback a consulta directa o matriz calculada
        }

        // Si el RPC no retornó códigos pero el usuario tiene un id_rol asignado,
        // consultamos directamente la tabla roles_permisos en base de datos
        if (rpcCodes === null && assignedRoleId) {
          try {
            const { data: rpRows } = await supabase
              .from('roles_permisos')
              .select('permisos(codigo)')
              .eq('id_rol', assignedRoleId)
            if (rpRows && rpRows.length > 0) {
              const directCodes = rpRows
                .map((r: any) => r.permisos?.codigo)
                .filter(Boolean)
                .map((c: string) => c.trim().toUpperCase())
              if (directCodes.length > 0) {
                rpcCodes = directCodes
              }
            }
          } catch (rpErr) {
            console.warn('Fallback roles_permisos no pudo ser consultado:', rpErr)
          }
        }

        // Si el usuario tenía un rol explícito en usuarios_roles que fue desactivado (activo = false),
        // bloqueamos sus permisos salvo que sea el propietario ('PRO')
        if (explicitRoleAssigned && !assignedRoleActive && staff.rol !== 'PRO') {
          const inactiveRoleName = dbRole || 'ROL_INACTIVO'
          const fullName = `${staff.nombres || ''} ${staff.apellidos || ''}`.trim() || 'Personal Veterinario'
          const profile: UserProfile = {
            id: authUserId,
            id_persona: staff.id_persona,
            id_veterinaria: staff.id_veterinaria,
            veterinaria_nombre: vet.nombre,
            role: mapDatabaseRoleToUserRole(staff.rol),
            rol_codigo: inactiveRoleName,
            permisos: [],
            nombres: staff.nombres,
            apellidos: staff.apellidos,
            nombre_completo: fullName,
            full_name: fullName,
            email: staff.email || authEmail || '',
            telefono: staff.telefono,
            phone: staff.telefono,
            foto_url: staff.foto_url,
            avatar_url: staff.foto_url,
            estado: staff.estado || 'VIG',
            is_active: staff.estado === 'VIG',
            tenant_id: String(staff.id_veterinaria),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          set({ user: profile, isAuthenticated: true, isLoading: false })
          return true
        }

        const effectiveRoleCode =
          staff.rol === 'PRO'
            ? 'ADMINISTRADOR'
            : rpcRoleName || dbRole || (staff.rol === 'MED' ? 'VETERINARIO' : 'RECEPCION')

        const role = mapDatabaseRoleToUserRole(effectiveRoleCode || staff.rol)
        let permisosList = getDefaultPermissionsForRole(effectiveRoleCode || role)

        if (effectiveRoleCode === 'ADMINISTRADOR') {
          permisosList = getDefaultPermissionsForRole('ADMINISTRADOR')
        } else if (rpcCodes !== null) {
          permisosList = rpcCodes as any
        }

        const fullName = `${staff.nombres || ''} ${staff.apellidos || ''}`.trim() || 'Personal Veterinario'

        const profile: UserProfile = {
          id: authUserId,
          id_persona: staff.id_persona,
          id_veterinaria: staff.id_veterinaria,
          veterinaria_nombre: vet.nombre,
          role,
          rol_codigo: effectiveRoleCode,
          permisos: permisosList,
          nombres: staff.nombres,
          apellidos: staff.apellidos,
          nombre_completo: fullName,
          full_name: fullName,
          email: staff.email || authEmail || '',
          telefono: staff.telefono,
          phone: staff.telefono,
          foto_url: staff.foto_url,
          avatar_url: staff.foto_url,
          estado: staff.estado || 'VIG',
          is_active: staff.estado === 'VIG',
          tenant_id: String(staff.id_veterinaria),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        set({ user: profile, isAuthenticated: true, isLoading: false })
        return true
      }

      // 5. Si no está en personal, verificar si coincide directamente con el email de una veterinaria
      if (authEmail) {
        const { data: vetDirect } = await supabase
          .from('veterinarias')
          .select('*')
          .ilike('email', authEmail.trim())
          .maybeSingle()

        if (vetDirect) {
          const { data: sub } = await supabase
            .from('suscripciones')
            .select('*')
            .eq('id_entidad', String(vetDirect.id_veterinaria))
            .maybeSingle()

          useTenantStore.getState().setCurrentTenant({
            id: String(vetDirect.id_veterinaria),
            id_veterinaria: vetDirect.id_veterinaria,
            name: vetDirect.nombre,
            slug: vetDirect.nombre?.toLowerCase().replace(/\s+/g, '-') || `vet-${vetDirect.id_veterinaria}`,
            phone: vetDirect.telefono,
            email: vetDirect.email,
            address: vetDirect.direccion,
            city: vetDirect.zona,
            country: 'Bolivia',
            status: sub?.estado || 'active',
            suscripcion: sub,
            created_at: vetDirect.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          const profile: UserProfile = {
            id: authUserId,
            id_veterinaria: vetDirect.id_veterinaria,
            veterinaria_nombre: vetDirect.nombre,
            role: 'clinic_admin',
            rol_codigo: 'PRO',
            permisos: getDefaultPermissionsForRole('clinic_admin'),
            nombres: vetDirect.nombre,
            apellidos: 'Admin',
            nombre_completo: `${vetDirect.nombre} (Administrador)`,
            full_name: `${vetDirect.nombre} (Administrador)`,
            email: authEmail,
            telefono: vetDirect.telefono,
            phone: vetDirect.telefono,
            estado: 'VIG',
            is_active: true,
            tenant_id: String(vetDirect.id_veterinaria),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          set({ user: profile, isAuthenticated: true, isLoading: false })
          return true
        }
      }

      // 6. Verificar si es Superadmin del SaaS
      const isSuper =
        authEmail?.toLowerCase().includes('superadmin') ||
        authEmail?.toLowerCase() === 'admin@vetbol.com'

      if (isSuper) {
        const superadminProfile: UserProfile = {
          id: authUserId,
          role: 'superadmin',
          rol_codigo: 'SUPERADMIN',
          permisos: getDefaultPermissionsForRole('SUPERADMIN'),
          nombres: 'SuperAdmin',
          apellidos: 'SaaS',
          nombre_completo: 'SuperAdmin SaaS VetBol',
          full_name: 'SuperAdmin SaaS VetBol',
          email: authEmail || '',
          is_active: true,
          tenant_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        useTenantStore.getState().setCurrentTenant(null)
        set({ user: superadminProfile, isAuthenticated: true, isLoading: false })
        return true
      }

      // No se encontró perfil válido para este usuario
      set({ user: null, isAuthenticated: false, isLoading: false })
      useTenantStore.getState().setCurrentTenant(null)
      return false
    } catch (error) {
      console.error('Error al cargar perfil de usuario:', error)
      set({ user: null, isAuthenticated: false, isLoading: false })
      useTenantStore.getState().setCurrentTenant(null)
      return false
    }
  },

  refreshPermissions: async () => {
    const currentUser = get().user
    if (!currentUser || currentUser.role === 'superadmin') return

    try {
      let rpcRoleName: string | null = null
      let rpcCodes: string[] | null = null

      const { data: rpcPermisos, error: rpcErr } = await supabasePublic.rpc('get_mis_permisos')
      if (!rpcErr && Array.isArray(rpcPermisos) && rpcPermisos.length > 0) {
        const firstRow = rpcPermisos[0] as any
        if (firstRow?.rol_nombre) {
          rpcRoleName = String(firstRow.rol_nombre).trim().toUpperCase()
        }
        if (Array.isArray(firstRow?.permisos_codigos)) {
          rpcCodes = firstRow.permisos_codigos.filter(Boolean)
        }
      }

      let refreshRoleId: number | null = null

      if (currentUser.id_persona) {
        const { data: userRoleData } = await supabase
          .from('usuarios_roles')
          .select('id_rol, roles:roles(id_rol, nombre, activo)')
          .eq('id_persona', currentUser.id_persona)
          .maybeSingle()

        if (userRoleData?.roles && typeof userRoleData.roles === 'object') {
          const rObj = userRoleData.roles as any
          refreshRoleId = userRoleData.id_rol ? Number(userRoleData.id_rol) : null
          if (rObj.activo === false && currentUser.rol_codigo !== 'PRO') {
            set({
              user: {
                ...currentUser,
                rol_codigo: rObj.nombre || 'ROL_INACTIVO',
                permisos: [],
              },
            })
            return
          }
          if (!rpcRoleName && rObj.nombre) {
            rpcRoleName = String(rObj.nombre).trim().toUpperCase()
          }
        }
      }

      if (rpcCodes === null && refreshRoleId) {
        try {
          const { data: rpRows } = await supabase
            .from('roles_permisos')
            .select('permisos(codigo)')
            .eq('id_rol', refreshRoleId)
          if (rpRows && rpRows.length > 0) {
            const directCodes = rpRows
              .map((r: any) => r.permisos?.codigo)
              .filter(Boolean)
              .map((c: string) => c.trim().toUpperCase())
            if (directCodes.length > 0) {
              rpcCodes = directCodes
            }
          }
        } catch (rpErr) {
          console.warn('Fallback roles_permisos en refresh falló:', rpErr)
        }
      }

      const nextRoleCode = rpcRoleName || currentUser.rol_codigo || 'VETERINARIO'
      const nextRole = mapDatabaseRoleToUserRole(nextRoleCode)
      const nextPermisos =
        nextRoleCode === 'ADMINISTRADOR' || nextRoleCode === 'PRO'
          ? getDefaultPermissionsForRole('ADMINISTRADOR')
          : rpcCodes !== null
          ? (rpcCodes as any)
          : getDefaultPermissionsForRole(nextRoleCode)

      set({
        user: {
          ...currentUser,
          role: nextRole,
          rol_codigo: nextRoleCode,
          permisos: nextPermisos,
          updated_at: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.warn('Error al refrescar permisos en caliente:', err)
    }
  },

  signInWithPassword: async (email: string, password: string) => {
    try {
      set({ isLoading: true })
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      if (data.user) {
        const loaded = await get().loadUserProfile(data.user.id, data.user.email)
        if (loaded) {
          return { success: true }
        }
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false, isLoading: false })
        return {
          success: false,
          error: 'Credenciales correctas, pero no se encontró un registro de clínica o personal activo para este usuario.',
        }
      }

      set({ isLoading: false })
      return { success: false, error: 'No se pudo autenticar el usuario.' }
    } catch (err: any) {
      set({ isLoading: false })
      return { success: false, error: err.message || 'Error inesperado de autenticación.' }
    }
  },

  initAuth: async () => {
    try {
      set({ isLoading: true })

      // Registrar listener reactivo de autenticación de Supabase una sola vez
      if (!authListenerRegistered) {
        authListenerRegistered = true
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            set({ user: null, isAuthenticated: false, isLoading: false })
            useTenantStore.getState().setCurrentTenant(null)
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const currentUser = get().user
            if (!currentUser || currentUser.id !== session.user.id) {
              await get().loadUserProfile(session.user.id, session.user.email)
            }
          }
        })
      }

      // Validar sesión actual persistida
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session?.user) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        useTenantStore.getState().setCurrentTenant(null)
        return
      }

      const loaded = await get().loadUserProfile(session.user.id, session.user.email)
      if (!loaded) {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false, isLoading: false })
        useTenantStore.getState().setCurrentTenant(null)
      }
    } catch (err) {
      console.error('Error al inicializar sesión:', err)
      set({ user: null, isAuthenticated: false, isLoading: false })
      useTenantStore.getState().setCurrentTenant(null)
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Error al cerrar sesión:', err)
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
    useTenantStore.getState().setCurrentTenant(null)
  },

  // Mantener compatibilidad si es invocado excepcionalmente, pero no por defecto
  loginWithMock: (role = 'clinic_admin') => {
    const isSuper = role === 'superadmin'
    const permissions = getDefaultPermissionsForRole(role)

    const mockProfile: UserProfile = {
      id: 'mock-user-id',
      role,
      rol_codigo: isSuper ? 'SUPERADMIN' : role === 'veterinarian' ? 'MED' : 'PRO',
      permisos: permissions,
      nombres: 'Usuario',
      apellidos: 'Demo',
      nombre_completo: 'Usuario Demo',
      full_name: 'Usuario Demo',
      email: 'demo@vetbol.com',
      is_active: true,
      tenant_id: isSuper ? null : '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    set({
      user: mockProfile,
      isAuthenticated: true,
      isLoading: false,
    })
  },
}))

// Inyectar el getter en permissions.ts para asertos defensivos sin ciclos de import
setAuthStoreGetter(() => useAuthStore.getState())
