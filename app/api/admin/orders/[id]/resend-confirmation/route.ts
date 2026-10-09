import { NextResponse, type NextRequest } from 'next/server'
import type { AdminOrder } from '@/lib/admin/types'
import { buildOrderLinesForEmail } from '@/lib/mail/build-order-email-lines'
import { getOrderConfirmationTemplate, getOrderEmailSubject } from '@/lib/mail/templates'
import { getPublicSiteBaseUrl } from '@/lib/mail/site-url'
import { sendMareboMailResult } from '@/lib/mail/send'
import { jsonError, jsonOk, requireAdminApiContext } from '@/lib/admin/require-admin-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = { params: Promise<{ id: string }> }

function shortOrderRef(orderId: string) {
  return orderId.replace(/-/g, '').slice(0, 10).toUpperCase()
}

/** POST { "to"?: "override@email.com" } — reenvía plantilla de confirmación (compra). */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminApiContext()
    if (!auth.ok) return auth.response

    const { id } = await context.params
    const orderId = String(id ?? '').trim()
    if (!orderId) return jsonError('ID de pedido inválido')

    const { data: row, error } = await auth.sb.from('orders').select('*').eq('id', orderId).maybeSingle()
    if (error) return jsonError(error.message, 400)
    if (!row) return jsonError('Pedido no encontrado', 404)

    let to = String((row as AdminOrder).customer_email ?? '').trim()
    try {
      const body = await req.json()
      if (body && typeof body === 'object' && typeof (body as { to?: unknown }).to === 'string') {
        const override = String((body as { to: string }).to).trim()
        if (override.includes('@')) to = override
      }
    } catch {
      /* optional body */
    }
    if (!to.includes('@')) return jsonError('El pedido no tiene email de cliente válido')

    const order = row as AdminOrder
    const siteUrl = getPublicSiteBaseUrl()
    const orderRef = shortOrderRef(orderId)
    const name = order.customer_name?.trim() || 'Cliente'
    const pack = await buildOrderLinesForEmail(order)
    const html = getOrderConfirmationTemplate({
      customerName: name,
      siteUrl,
      orderId,
      orderRef,
      ...pack,
    })

    const result = await sendMareboMailResult({
      to,
      subject: getOrderEmailSubject('En preparación', name),
      html,
    })
    if (!result.ok) return jsonError(result.error, 503)

    const { error: markErr } = await auth.sb.from('orders').update({ emails_sent: true }).eq('id', orderId)
    if (markErr && !String(markErr.message).includes('emails_sent')) {
      console.warn('[admin] resend-confirmation: no se pudo marcar emails_sent', markErr.message)
    }

    return jsonOk({ sentTo: to })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al reenviar confirmación'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
