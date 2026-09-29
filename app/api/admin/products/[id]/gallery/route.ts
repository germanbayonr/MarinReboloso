import { NextResponse, type NextRequest } from 'next/server'
import { runSyncProductGallery } from '@/lib/admin/product-edit-server'
import { jsonError, jsonOk, requireAdminApiContext } from '@/lib/admin/require-admin-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminApiContext()
    if (!auth.ok) return auth.response

    const { id } = await context.params
    const productId = String(id ?? '').trim()
    if (!productId) return jsonError('ID de producto inválido')

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonError('Cuerpo JSON inválido')
    }

    const o = body != null && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const image_urls = Array.isArray(o.image_urls)
      ? o.image_urls.map((u) => String(u ?? '').trim()).filter(Boolean)
      : []
    const removed_urls = Array.isArray(o.removed_urls)
      ? o.removed_urls.map((u) => String(u ?? '').trim()).filter(Boolean)
      : []
    const update_stripe_image = o.update_stripe_image === true

    const result = await runSyncProductGallery(auth.sb, productId, {
      image_urls,
      removed_urls,
      update_stripe_image,
    })
    if (!result.ok) return jsonError(result.error, 400)
    return jsonOk({ product: result.product })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al sincronizar galería'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
