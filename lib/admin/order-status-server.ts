import type { SupabaseClient } from '@supabase/supabase-js'
import { ORDER_STATUSES, type AdminOrder, type AdminOrderStatusPayload, type OrderStatus } from '@/lib/admin/types'
import { notifyCustomerOrderStatusChange } from '@/lib/mail/order-status-mail'

export async function runAdminUpdateOrderStatus(
  sb: SupabaseClient,
  id: string,
  status: OrderStatus,
  payload?: AdminOrderStatusPayload,
): Promise<
  | { ok: true; email: 'sent' | 'skipped' | 'none' | 'failed'; emailError?: string }
  | { ok: false; error: string }
> {
  const orderId = String(id ?? '').trim()
  if (!orderId) return { ok: false, error: 'ID de pedido inválido' }

  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false, error: 'Estado no válido' }
  }

  if (status === 'enviado') {
    const carrier = payload?.shippingCarrier
    if (carrier !== 'correos' && carrier !== 'packlink') {
      return { ok: false, error: 'Selecciona Correos o Packlink para el envío.' }
    }
    if (carrier === 'correos') {
      const t = payload?.trackingNumber?.trim()
      if (!t) return { ok: false, error: 'Indica el número de seguimiento de Correos.' }
    }
    if (carrier === 'packlink') {
      const u = payload?.packlinkUrl?.trim()
      if (!u) return { ok: false, error: 'Indica el enlace de seguimiento de Packlink.' }
      try {
        new URL(u)
      } catch {
        return { ok: false, error: 'El enlace de Packlink no es una URL válida.' }
      }
    }
  }

  const { data: row, error: fetchErr } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!row) return { ok: false, error: 'Pedido no encontrado' }

  const previous = String((row as { status?: string }).status ?? '')
  if (previous === status) {
    return { ok: true, email: 'skipped' }
  }

  const patch: Record<string, unknown> = { status }
  if (status === 'enviado' && payload?.shippingCarrier) {
    patch.shipping_carrier = payload.shippingCarrier
    if (payload.shippingCarrier === 'correos') {
      patch.tracking_number = payload.trackingNumber?.trim() ?? null
      patch.packlink_url = null
    } else {
      patch.packlink_url = payload.packlinkUrl?.trim() ?? null
      patch.tracking_number = null
    }
  }

  const { error } = await sb.from('orders').update(patch).eq('id', orderId)
  if (error) return { ok: false, error: error.message }

  const { data: refreshed, error: refetchErr } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (refetchErr || !refreshed) {
    console.warn('[admin] runAdminUpdateOrderStatus: no se pudo releer el pedido tras UPDATE', refetchErr?.message)
    return { ok: true, email: 'none' }
  }

  const customer_email =
    typeof refreshed.customer_email === 'string' ? refreshed.customer_email.trim() : ''

  if (!customer_email || !customer_email.includes('@')) {
    return { ok: true, email: 'none' }
  }

  const mailResult = await notifyCustomerOrderStatusChange(refreshed as AdminOrder, status)
  if (!mailResult.ok) {
    return {
      ok: true,
      email: 'failed',
      emailError: mailResult.error,
    }
  }
  if ('skipped' in mailResult && mailResult.skipped) {
    return { ok: true, email: 'skipped' }
  }
  return { ok: true, email: 'sent' }
}

export async function runAdminDeleteOrder(
  sb: SupabaseClient,
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const orderId = String(id ?? '').trim()
  if (!orderId) return { ok: false, error: 'ID de pedido inválido' }
  const { error } = await sb.from('orders').delete().eq('id', orderId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
