import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

const REMEMBER_SESSION_KEY = 'flux-remember-session'

export function getRememberSession(): boolean {
  try {
    return localStorage.getItem(REMEMBER_SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

export function setRememberSession(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_SESSION_KEY, remember ? 'true' : 'false')
  } catch {
    /* Ignore storage errors in restricted environments. */
  }
}

const sessionAwareStorage = {
  getItem(key: string) {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string) {
    try {
      if (getRememberSession()) {
        localStorage.setItem(key, value)
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, value)
        localStorage.removeItem(key)
      }
    } catch {
      /* Ignore storage errors in restricted environments. */
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      /* Ignore storage errors in restricted environments. */
    }
  },
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: sessionAwareStorage,
      },
    })
  : null
