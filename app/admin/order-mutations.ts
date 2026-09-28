'use server'

import { assertAdminMutationContext } from '@/lib/admin/server'
import { runAdminDeleteOrder, runAdminUpdateOrderStatus } from '@/lib/admin/order-status-server'
import type { AdminOrderStatusPayload, OrderStatus } from '@/lib/admin/types'

export async function adminUpdateOrderStatus(
  id: string,
  status: OrderStatus,
  payload?: AdminOrderStatusPayload,
) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  return runAdminUpdateOrderStatus(ctx.sb, id, status, payload)
}

export async function adminDeleteOrder(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  return runAdminDeleteOrder(ctx.sb, id)
}
