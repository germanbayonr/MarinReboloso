import type { AdminOrder, AdminOrderStatusPayload, OrderStatus } from '@/lib/admin/types'

export async function updateOrderStatusViaApi(
  id: string,
  status: OrderStatus,
  payload?: AdminOrderStatusPayload,
): Promise<
  | { ok: true; email: 'sent' | 'skipped' | 'none' | 'failed'; emailError?: string }
  | { ok: false; error: string }
> {
  const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ status, payload }),
  })
  try {
    return (await res.json()) as Awaited<ReturnType<typeof updateOrderStatusViaApi>>
  } catch {
    return { ok: false, error: `Respuesta inválida (${res.status})` }
  }
}

export async function syncOrdersFromStripeViaApi(input?: { daysBack?: number }): Promise<
  | {
      ok: true
      scannedSessions: number
      eligibleSessions: number
      existingSessions: number
      importedCount: number
      skippedNoLineItems: number
      importedOrders: AdminOrder[]
    }
  | { ok: false; error: string }
> {
  const res = await fetch('/api/admin/orders/sync-stripe', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input ?? {}),
  })
  try {
    return (await res.json()) as Awaited<ReturnType<typeof syncOrdersFromStripeViaApi>>
  } catch {
    return { ok: false, error: `Respuesta inválida (${res.status})` }
  }
}
