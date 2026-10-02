import { NextResponse, type NextRequest } from 'next/server'
import { runCreateProduct } from '@/lib/admin/create-product-server'
import type { AdminProductInput } from '@/lib/admin/product-input'
import { revalidateStorefrontCatalogPaths } from '@/lib/admin/revalidate-catalog'
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
    if (body == null || typeof body !== 'object') return jsonError('Payload inválido')

    const input = body as AdminProductInput
    if (!String(input.name ?? '').trim()) return jsonError('El nombre es obligatorio')

    const result = await runCreateProduct(auth.sb, input)
    if (!result.ok) return jsonError(result.error, 400)

    revalidateStorefrontCatalogPaths(input.collection)
    return jsonOk({ id: result.id }, 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al crear producto'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
