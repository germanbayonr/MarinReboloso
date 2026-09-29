import { NextResponse } from 'next/server'
import { getSessionUser, getServiceSupabaseSafe } from '@/lib/admin/server'
import { isAdminPanelEmail } from '@/lib/admin-config'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function requireAdminApiContext():
  | { ok: true; sb: SupabaseClient; email: string }
  | { ok: false; response: NextResponse } {
  const user = await getSessionUser()
  if (!isAdminPanelEmail(user?.email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Sesión admin expirada. Recarga e inicia sesión en /admin/login.' },
        { status: 401 },
      ),
    }
  }
  const sup = getServiceSupabaseSafe()
  if (!sup.ok) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: sup.error }, { status: 503 }),
    }
  }
  return { ok: true, sb: sup.client, email: String(user!.email) }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function jsonOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json({ ok: true, ...body }, { status, headers: { 'Cache-Control': 'no-store' } })
}
