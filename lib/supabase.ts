import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase client (cookie-backed session for Next.js middleware).
 * Use only in Client Components.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export const supabase = createBrowserSupabaseClient()
