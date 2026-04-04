import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ADMIN_EMAIL = 'marebo.meri@gmail.com'
const ADMIN_PASSWORD = 'admin123'

export async function GET() {
  // Safety guard: never allow this endpoint in production.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Forbidden in production' }, { status: 403 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json(
      { success: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 },
    )
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...(init ?? {}), cache: 'no-store' }) },
  })

  try {
    // Find existing user by email (paginate listUsers).
    let found: { id: string } | null = null
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      const match = data.users.find((u) => (u.email ?? '').toLowerCase() === ADMIN_EMAIL.toLowerCase())
      if (match) {
        found = { id: match.id }
        break
      }
      if (!data.users.length) break
    }

    if (found) {
      const { error } = await supabase.auth.admin.deleteUser(found.id)
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
    }

    const { error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    })

    if (createError) {
      return NextResponse.json({ success: false, error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Admin creado y verificado con éxito' })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

