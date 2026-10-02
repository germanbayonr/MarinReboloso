import { NextResponse } from 'next/server'
import { runSyncProductsWithStripe } from '@/lib/admin/stripe-products-sync-server'
import { revalidateStorefrontCatalogPaths } from '@/lib/admin/revalidate-catalog'
import { jsonError, jsonOk, requireAdminApiContext } from '@/lib/admin/require-admin-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    const auth = await requireAdminApiContext()
    if (!auth.ok) return auth.response

    const result = await runSyncProductsWithStripe(auth.sb)
    if (result.syncedCount > 0) {
      revalidateStorefrontCatalogPaths()
    }
    return jsonOk(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al sincronizar con Stripe'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
