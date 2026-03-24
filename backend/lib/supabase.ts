import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialized so the build doesn't fail when SUPABASE_URL is not yet set.

let _admin: SupabaseClient | null = null
let _anon: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
    _admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}

export function getSupabaseAnon(): SupabaseClient {
  if (!_anon) {
    const url = process.env.SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
    _anon = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _anon
}

// Convenience aliases kept for backwards compat with repository files
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => (getSupabaseAdmin() as any)[prop],
})

export const supabaseAnon = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => (getSupabaseAnon() as any)[prop],
})
