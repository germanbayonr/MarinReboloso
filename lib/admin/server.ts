import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdminPanelEmail } from '@/lib/admin-config'
import { logAdminSupabaseIssue } from '@/lib/admin/supabase-admin-log'
import { jwtRoleFromSupabaseKey } from '@/lib/supabase/jwt-role'

export async function getSessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            /* RSC: refresh puede no permitir set en algunas rutas */
          }
        },
      },
    },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function ensureAdminOrRedirect() {
  const user = await getSessionUser()
  if (!isAdminPanelEmail(user?.email)) {
    redirect('/?acceso=denegado')
  }
  return user
}

/**
 * Cliente Supabase con **service role** (bypass RLS).
 * Obligatorio en webhooks, admin y cualquier escritura sin sesión de usuario (p. ej. pedidos Stripe).
 */
export function getServiceSupabase() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  /** Solo `SUPABASE_SERVICE_ROLE_KEY`: otros nombres suelen estar mal copiados y provocan RLS con clave anon. */
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()

  if (!url || !key) {
    const msg =
      'Faltan SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL, o SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role secret).'
    logAdminSupabaseIssue('MISSING_SERVICE_ENV', msg, {
      hasUrl: url ? 'yes' : 'no',
      hasServiceRoleKey: key ? 'yes' : 'no',
    })
    throw new Error(msg)
  }

  if (anonKey && key === anonKey) {
    const msg =
      'SUPABASE_SERVICE_ROLE_KEY es idéntica a la clave anon. En Supabase → Project Settings → API copia el secret «service_role», no «anon».'
    logAdminSupabaseIssue('SERVICE_ROLE_EQUALS_ANON', msg)
    throw new Error(msg)
  }

  const jwtRole = jwtRoleFromSupabaseKey(key)
  if (jwtRole && jwtRole !== 'service_role') {
    const msg = `La clave en SUPABASE_SERVICE_ROLE_KEY no es service_role (JWT role="${jwtRole}"). Usa el secret service_role del proyecto Supabase.`
    logAdminSupabaseIssue('JWT_ROLE_NOT_SERVICE_ROLE', msg, { jwtRole })
    throw new Error(msg)
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...(init ?? {}), cache: 'no-store' }) },
  })
}
