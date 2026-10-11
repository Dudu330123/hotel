import { createClient } from '@supabase/supabase-js'

const hostedProjectUrl = 'https://ibyofduaflibhbeptqee.supabase.co'
const hostedPublishableKey = 'sb_publishable_NSntcKmWFME_5fFQw-KX7g_yMTFmhfQ'
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// A chave publishable é própria para o navegador. O fallback só existe no build publicado;
// no desenvolvimento, o .env.local continua sendo a fonte preferencial.
const supabaseUrl = envUrl || (import.meta.env.PROD ? hostedProjectUrl : undefined)
const supabaseAnonKey = envAnonKey || (import.meta.env.PROD ? hostedPublishableKey : undefined)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

