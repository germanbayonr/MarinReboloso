import { NextResponse, type NextRequest } from 'next/server'
import { patchAdminProductRow } from '@/lib/admin/patch-admin-product'
import { runAdminDeleteProduct } from '@/lib/admin/product-delete-server'
import { runUpdateProduct } from '@/lib/admin/product-edit-server'
import type { AdminProductInput } from '@/lib/admin/product-input'
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

    const patch: Record<string, unknown> = {}
    if (body != null && typeof body === 'object') {
      const o = body as Record<string, unknown>
      if (typeof o.in_stock === 'boolean') patch.in_stock = o.in_stock
      if (typeof o.is_active === 'boolean') patch.is_active = o.is_active
    }
    if (Object.keys(patch).length === 0) {
      return jsonError('Indica in_stock o is_active (boolean)')
    }

    const result = await patchAdminProductRow(auth.sb, productId, patch)
    if (!result.ok) return jsonError(result.error, 400)
    return jsonOk({ product: result.product })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al actualizar producto'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
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
    if (body == null || typeof body !== 'object') return jsonError('Payload inválido')

    const input = body as AdminProductInput
    if (!String(input.name ?? '').trim()) return jsonError('El nombre es obligatorio')

    const result = await runUpdateProduct(auth.sb, productId, input)
    if (!result.ok) return jsonError(result.error, 400)
    return jsonOk({ product: result.product })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al guardar producto'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminApiContext()
    if (!auth.ok) return auth.response

    const { id } = await context.params
    const productId = String(id ?? '').trim()
    if (!productId) return jsonError('ID de producto inválido')

    const result = await runAdminDeleteProduct(auth.sb, productId)
    if (!result.ok) return jsonError(result.error, 400)
    return jsonOk({ deleted: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al eliminar producto'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
