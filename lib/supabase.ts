import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Keep the public landing page renderable before backend configuration.
// Features that need the database check supabaseConfigured before requesting it.
export const supabase = createClient(supabaseUrl || 'https://unconfigured.invalid', supabaseAnonKey || 'unconfigured', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
