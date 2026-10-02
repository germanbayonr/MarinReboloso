import { NextResponse, type NextRequest } from 'next/server'
import { runAdminUpdateOrderStatus } from '@/lib/admin/order-status-server'
import type { AdminOrderStatusPayload, OrderStatus } from '@/lib/admin/types'
import { ORDER_STATUSES } from '@/lib/admin/types'
import { jsonError, jsonOk, requireAdminApiContext } from '@/lib/admin/require-admin-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminApiContext()
    if (!auth.ok) return auth.response

    const { id } = await context.params
    const orderId = String(id ?? '').trim()
    if (!orderId) return jsonError('ID de pedido inválido')

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonError('Cuerpo JSON inválido')
    }
    const o = body != null && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const status = String(o.status ?? '').trim() as OrderStatus
    if (!ORDER_STATUSES.includes(status)) return jsonError('Estado no válido')

    const payload = o.payload as AdminOrderStatusPayload | undefined

    const result = await runAdminUpdateOrderStatus(auth.sb, orderId, status, payload)
    if (!result.ok) return jsonError(result.error, 400)
    return jsonOk({ email: result.email, emailError: result.emailError })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al actualizar pedido'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
