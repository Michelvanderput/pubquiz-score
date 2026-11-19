import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// Server-only Supabase client met de service role key. Nooit naar de client sturen.
export function useSupabaseAdmin(): SupabaseClient {
  if (client) return client

  const config = useRuntimeConfig()
  const url = config.supabaseUrl
  const key = config.supabaseServiceRoleKey

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase is niet geconfigureerd (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken).'
    })
  }

  client = createClient(url, key, {
    auth: { persistSession: false }
  })
  return client
}
