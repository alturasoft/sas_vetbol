import { createClient } from '@supabase/supabase-js'
import { env } from './env'
import type { Database } from '@/types/database.types'

export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    db: {
      schema: 'veterinarias' as any,
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)



/**
 * Cliente para consultas directas al esquema public (para RPCs como get_mis_permisos)
 */
export const supabasePublic = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

