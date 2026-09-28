import { NextResponse } from 'next/server'
import { getSessionUser, getServiceSupabaseSafe } from '@/lib/admin/server'
import { loadAdminProductsForPanel } from '@/lib/admin/load-admin-products'
import { loadAdminOrdersForPanel } from '@/lib/admin/load-admin-orders'
import { isAdminPanelEmail } from '@/lib/admin-config'
import {
  checkAdminEnvironment,
  migrationManifestForHealth,
  probeDatabaseMigrations,
} from '@/lib/admin/health-check'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!isAdminPanelEmail(user?.email)) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }

    const envCheck = checkAdminEnvironment()
    const manifest = migrationManifestForHealth()

    let productsPage = {
      loadOk: false,
      productCount: 0,
      payloadBytes: null as number | null,
      error: null as string | null,
    }
    let ordersPage = {
      loadOk: false,
      orderCount: 0,
      payloadBytes: null as number | null,
      error: null as string | null,
    }

    const sup = getServiceSupabaseSafe()
    if (!sup.ok) {
      productsPage.error = sup.error
      ordersPage.error = sup.error
      envCheck.ok = false
      envCheck.issues.push(sup.error)
    } else {
      try {
        const products = await loadAdminProductsForPanel(sup.client)
        productsPage = {
          loadOk: true,
          productCount: products.length,
          payloadBytes: Buffer.byteLength(JSON.stringify(products), 'utf8'),
          error: null,
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        productsPage.error = msg
        envCheck.ok = false
        envCheck.issues.push(`La carga de /admin/productos falla: ${msg}`)
      }
      try {
        const orders = await loadAdminOrdersForPanel(sup.client)
        ordersPage = {
          loadOk: true,
          orderCount: orders.length,
          payloadBytes: Buffer.byteLength(JSON.stringify(orders), 'utf8'),
          error: null,
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        ordersPage.error = msg
        envCheck.ok = false
        envCheck.issues.push(`La carga de /admin/pedidos falla: ${msg}`)
      }
    }

    let database: {
      reachable: boolean
      error: string | null
      migrationProbes: Awaited<ReturnType<typeof probeDatabaseMigrations>>
    } = {
      reachable: false,
      error: null,
      migrationProbes: [],
    }

    if (sup.ok) {
      try {
        database.migrationProbes = await probeDatabaseMigrations(sup.client)
        database.reachable = true
        const probeErrors = database.migrationProbes.filter((p) => p.status !== 'ok')
        if (probeErrors.length > 0) {
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
        envCheck.ok = false
        envCheck.issues.push(database.error)
      }
    } else {
      database.error = sup.error
    }

    const body = {
      ok:
        envCheck.ok &&
        productsPage.loadOk &&
        ordersPage.loadOk &&
        database.reachable &&
        database.migrationProbes.every((p) => p.status === 'ok'),
      checkedAt: new Date().toISOString(),
      adminEmail: user?.email ?? null,
      environment: envCheck.env,
      issues: envCheck.issues,
      productsPage,
      ordersPage,
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
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: 'Fallo interno en /api/admin/health; revisa Vercel Logs con este mensaje.',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
