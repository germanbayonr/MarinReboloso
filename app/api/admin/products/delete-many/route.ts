import { NextResponse, type NextRequest } from 'next/server'
import { runAdminDeleteProducts } from '@/lib/admin/product-delete-server'
import { jsonError, jsonOk, requireAdminApiContext } from '@/lib/admin/require-admin-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApiContext()
    if (!auth.ok) return auth.response

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonError('Cuerpo JSON inválido')
    }

    const ids = Array.isArray((body as { ids?: unknown })?.ids)
      ? ((body as { ids: unknown[] }).ids.map((x) => String(x ?? '').trim()).filter(Boolean))
      : []
    if (ids.length === 0) return jsonError('Indica ids (array de UUID)')

    const result = await runAdminDeleteProducts(auth.sb, ids)
    if (!result.ok) return jsonError(result.error, 400)
    return jsonOk({ deletedCount: result.deletedCount, failures: result.failures })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al eliminar productos'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
