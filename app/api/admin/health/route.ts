import { NextResponse } from 'next/server'
import { getSessionUser, getServiceSupabaseSafe } from '@/lib/admin/server'
import { isAdminPanelEmail } from '@/lib/admin-config'
import {
  checkAdminEnvironment,
  migrationManifestForHealth,
  probeDatabaseMigrations,
} from '@/lib/admin/health-check'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const user = await getSessionUser()
  if (!isAdminPanelEmail(user?.email)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  }

  const envCheck = checkAdminEnvironment()
  const manifest = migrationManifestForHealth()

  let database: {
    reachable: boolean
    error: string | null
    migrationProbes: Awaited<ReturnType<typeof probeDatabaseMigrations>>
  } = {
    reachable: false,
    error: null,
    migrationProbes: [],
  }

  const sup = getServiceSupabaseSafe()
  if (!sup.ok) {
    database.error = sup.error
  } else {
    try {
      database.migrationProbes = await probeDatabaseMigrations(sup.client)
      database.reachable = true
      const probeErrors = database.migrationProbes.filter((p) => p.status !== 'ok')
      if (probeErrors.length > 0 && envCheck.ok) {
        envCheck.ok = false
        for (const p of probeErrors) {
          if (p.status === 'missing') {
            envCheck.issues.push(
              `Migración pendiente (${p.migrationFile}): ${p.description}${p.detail ? ` — ${p.detail}` : ''}`,
            )
          } else if (p.detail) {
            envCheck.issues.push(`BD (${p.id}): ${p.detail}`)
          }
        }
      }
    } catch (e) {
      database.error = e instanceof Error ? e.message : String(e)
    }
  }

  const body = {
    ok: envCheck.ok && database.reachable && database.migrationProbes.every((p) => p.status === 'ok'),
    checkedAt: new Date().toISOString(),
    adminEmail: user?.email ?? null,
    environment: envCheck.env,
    issues: envCheck.issues,
    database,
    migrations: manifest,
    hints: [
      'Variables en Vercel → Settings → Environment Variables → Production; redeploy tras cambios.',
      'Usuario admin en Supabase Auth: node --env-file=.env.local scripts/seed-admin-user.mjs (con URL y service role de producción).',
      'Aplicar SQL pendiente: Supabase Dashboard → SQL o supabase db push / migraciones del repo.',
    ],
  }

  return NextResponse.json(body, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
