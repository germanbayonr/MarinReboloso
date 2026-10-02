import type { AdminOrder, OrderStatus } from '@/lib/admin/types'
import { buildOrderLinesForEmail } from '@/lib/mail/build-order-email-lines'
import {
  getCancelledOrderTemplate,
  getDeliveredTemplate,
  getOrderConfirmationTemplate,
  getOrderEmailSubject,
  getRefundedOrderTemplate,
  getShippingTemplate,
} from '@/lib/mail/templates'
import { getPublicSiteBaseUrl } from '@/lib/mail/site-url'
import { sendMareboMailResult } from '@/lib/mail/send'

function shortRef(orderId: string) {
  return orderId.replace(/-/g, '').slice(0, 10).toUpperCase()
}

function customerDisplayName(order: AdminOrder): string {
  const n = order.customer_name?.trim()
  return n || 'Cliente'
}

function orderExtra(order: AdminOrder) {
  const r = order as AdminOrder & {
    tracking_number?: string | null
    packlink_url?: string | null
    shipping_carrier?: string | null
    shipping_cents?: number | null
  }
  const sc = typeof r.shipping_carrier === 'string' ? r.shipping_carrier.trim().toLowerCase() : ''
  const carrier = sc === 'packlink' ? ('packlink' as const) : ('correos' as const)
  return {
    carrier,
    trackingNumber: typeof r.tracking_number === 'string' ? r.tracking_number : '',
    packlinkUrl: typeof r.packlink_url === 'string' ? r.packlink_url : '',
    shippingCents: typeof r.shipping_cents === 'number' ? r.shipping_cents : null,
  }
}

export async function notifyCustomerOrderStatusChange(
  order: AdminOrder,
  newStatus: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string } | { ok: true; skipped: true }> {
  const to = order.customer_email?.trim()
  if (!to || !to.includes('@')) {
    return { ok: false, error: 'El pedido no tiene email de cliente válido.' }
  }

  const ref = shortRef(order.id)
  const extra = orderExtra(order)
  const siteUrl = getPublicSiteBaseUrl()
  const name = customerDisplayName(order)

  try {
    switch (newStatus) {
      case 'pendiente': {
        const { lines, subtotalCents, shippingCents, totalCents, currency } = await buildOrderLinesForEmail(order)
        const html = getOrderConfirmationTemplate({
          customerName: name,
          siteUrl,
          orderId: order.id,
          orderRef: ref,
          lines,
          subtotalCents,
          shippingCents,
          totalCents,
          currency,
        })
        return sendMareboMailResult({
          to,
          subject: getOrderEmailSubject('En preparación', name),
          html,
        })
      }
      case 'preparando': {
        return { ok: true, skipped: true }
      }
      case 'enviado': {
        const { lines, subtotalCents, shippingCents, totalCents, currency } = await buildOrderLinesForEmail(order)
        const html = getShippingTemplate({
          customerName: name,
          siteUrl,
          orderId: order.id,
          orderRef: ref,
          carrier: extra.carrier,
          trackingNumber: extra.trackingNumber,
          packlinkUrl: extra.packlinkUrl,
          lines,
          subtotalCents,
          shippingCents,
          totalCents,
          currency,
        })
        return sendMareboMailResult({
          to,
          subject: getOrderEmailSubject('En camino', name),
          html,
        })
      }
      case 'entregado': {
        const { lines, subtotalCents, shippingCents, totalCents, currency } = await buildOrderLinesForEmail(order)
        const html = getDeliveredTemplate({
          customerName: name,
          siteUrl,
          orderId: order.id,
          orderRef: ref,
          lines,
          subtotalCents,
          shippingCents,
          totalCents,
          currency,
        })
        return sendMareboMailResult({
          to,
          subject: getOrderEmailSubject('Entregado', name),
          html,
        })
      }
      case 'cancelado': {
        const html = getCancelledOrderTemplate({ orderRef: ref, orderId: order.id, siteUrl })
        return sendMareboMailResult({
          to,
          subject: getOrderEmailSubject('Cancelado', name),
          html,
        })
      }
      case 'reembolsado': {
        const html = getRefundedOrderTemplate({ orderRef: ref, orderId: order.id, siteUrl })
        return sendMareboMailResult({
          to,
          subject: getOrderEmailSubject('Reembolso', name),
          html,
        })
      }
      default:
        return { ok: true, skipped: true }
    }
  } catch (e) {
    console.error('[mail] notifyCustomerOrderStatusChange:', e)
    const message = e instanceof Error ? e.message : 'Error al enviar correo'
    return { ok: false, error: message }
  }
}
