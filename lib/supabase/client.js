// Shared Supabase client setup.
// Keeping the config check here makes the rest of the app safer when env vars are missing.
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key && url.startsWith('https://') && key.length > 20)
export const supabase = isSupabaseConfigured ? createClient(url, key) : null
