import { NextResponse, type NextRequest } from 'next/server'
import { runSyncOrdersFromStripe } from '@/lib/admin/stripe-orders-sync-server'
import { jsonError, jsonOk, requireAdminApiContext } from '@/lib/admin/require-admin-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApiContext()
    if (!auth.ok) return auth.response

    let daysBack: number | undefined
    try {
      const body = await req.json()
      if (body != null && typeof body === 'object' && 'daysBack' in body) {
        const raw = Number((body as { daysBack?: unknown }).daysBack)
        if (Number.isFinite(raw)) daysBack = raw
      }
    } catch {
      /* body opcional */
    }

    const result = await runSyncOrdersFromStripe(auth.sb, { daysBack })
    if (!result.ok) return jsonError(result.error, 400)
    return jsonOk(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al sincronizar pedidos'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
