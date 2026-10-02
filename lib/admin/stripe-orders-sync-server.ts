import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminOrder } from '@/lib/admin/types'
import { stripeSecretKey } from '@/lib/admin/stripe-secret-key'
import { checkoutNameFromStripeSession, customerPhoneFromStripeSession } from '@/lib/stripe-session-customer'

export type AdminStripeSyncInput = {
  daysBack?: number
}

export type AdminStripeSyncResult =
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

function shippingBlockFromStripeSession(session: Stripe.Checkout.Session) {
  const s = session as Stripe.Checkout.Session & {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null }
    shipping?: { name?: string | null; address?: Stripe.Address | null }
  }
  return s.shipping_details ?? s.shipping ?? null
}

function shippingFieldsFromStripeSession(session: Stripe.Checkout.Session) {
  const block = shippingBlockFromStripeSession(session)
  const addr = block?.address
  return {
    shipping_address: addr?.line1?.trim() || null,
    shipping_city: addr?.city?.trim() || null,
    shipping_postal_code: addr?.postal_code?.trim() || null,
    shipping_country: addr?.country?.trim() || null,
  }
}

export async function runSyncOrdersFromStripe(
  sb: SupabaseClient,
  input?: AdminStripeSyncInput,
): Promise<AdminStripeSyncResult> {
  const secret = stripeSecretKey()
  if (!secret) return { ok: false, error: 'Falta STRIPE_SECRET_KEY para sincronizar pedidos.' }
  const stripe = new Stripe(secret)

  const daysBackRaw = Number(input?.daysBack ?? 120)
  const daysBack = Number.isFinite(daysBackRaw) ? Math.min(3650, Math.max(1, Math.floor(daysBackRaw))) : 120
  const gte = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60

  const sessions: Stripe.Checkout.Session[] = []
  let startingAfter: string | undefined

  while (true) {
    const page = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte },
      starting_after: startingAfter,
    })
    sessions.push(...page.data)
    if (!page.has_more) break
    startingAfter = page.data[page.data.length - 1]?.id
    if (!startingAfter) break
  }

  const eligible = sessions.filter((s) => {
    if (s.mode !== 'payment') return false
    if (s.status !== 'complete') return false
    return s.payment_status === 'paid' || s.payment_status === 'no_payment_required'
  })
  const sessionIds = eligible.map((s) => s.id)

  const existingSessionIds = new Set<string>()
  for (let i = 0; i < sessionIds.length; i += 200) {
    const chunk = sessionIds.slice(i, i + 200)
    if (chunk.length === 0) continue
    const { data, error } = await sb.from('orders').select('stripe_session_id').in('stripe_session_id', chunk)
    if (error) return { ok: false, error: error.message }
    for (const row of data ?? []) {
      const value = typeof row.stripe_session_id === 'string' ? row.stripe_session_id.trim() : ''
      if (value) existingSessionIds.add(value)
    }
  }

  const missingSessionIds = sessionIds.filter((id) => !existingSessionIds.has(id))
  const insertedIds: string[] = []
  let skippedNoLineItems = 0

  for (const sessionId of missingSessionIds) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    })
    const lineItems = session.line_items?.data ?? []
    if (lineItems.length === 0) {
      skippedNoLineItems += 1
      continue
    }

    const summaryParts: string[] = []
    const itemsJson: Array<Record<string, unknown>> = []

    for (const li of lineItems) {
      const qty = typeof li.quantity === 'number' && li.quantity > 0 ? li.quantity : 1
      const lineCents =
        typeof li.amount_total === 'number'
          ? li.amount_total
          : typeof li.amount_subtotal === 'number'
            ? li.amount_subtotal
            : 0
      const lineTotal = lineCents / 100
      const priceObj =
        li.price && typeof li.price === 'object' && 'id' in li.price ? (li.price as Stripe.Price) : null
      const rawProduct = priceObj?.product
      const product =
        rawProduct && typeof rawProduct === 'object' && 'name' in rawProduct ? (rawProduct as Stripe.Product) : null
      const description = li.description?.trim() || product?.name?.trim() || 'Producto'
      const image = typeof product?.images?.[0] === 'string' ? product.images[0].trim() : null
      const unit = typeof priceObj?.unit_amount === 'number' ? priceObj.unit_amount / 100 : lineTotal / Math.max(1, qty)

      itemsJson.push({
        name: description,
        quantity: qty,
        line_total: Number.isFinite(lineTotal) ? lineTotal : unit * qty,
        image_url: image,
        price: Number.isFinite(unit) ? unit : 0,
        stripe_price_id: priceObj?.id ?? null,
      })
      summaryParts.push(`${qty}× ${description}`)
    }

    const shipping = shippingFieldsFromStripeSession(session)
    const shippingName = shippingBlockFromStripeSession(session)?.name?.trim() || null
    const customerName =
      shippingName || checkoutNameFromStripeSession(session) || session.customer_details?.name?.trim() || null
    const customerEmail = (session.customer_details?.email || session.customer_email || '').trim() || null
    const customerPhone = customerPhoneFromStripeSession(session)
    const totalAmount = typeof session.amount_total === 'number' ? session.amount_total / 100 : null
    const shippingCents =
      session.shipping_cost && typeof session.shipping_cost.amount_total === 'number'
        ? session.shipping_cost.amount_total
        : null

    const payload: Record<string, unknown> = {
      stripe_session_id: session.id,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      total_amount: totalAmount,
      currency: (session.currency || 'eur').toLowerCase(),
      status: 'pendiente',
      line_summary: summaryParts.join(' · '),
      items_json: itemsJson,
      emails_sent: false,
      ...shipping,
    }
    if (shippingCents != null) payload.shipping_cents = shippingCents

    const { data, error } = await sb.from('orders').insert(payload).select('*').maybeSingle()
    if (error) {
      const msg = String(error.message ?? '')
      if (
        msg.includes("Could not find the 'emails_sent' column") ||
        msg.includes("Could not find the 'shipping_cents' column")
      ) {
        const fallbackPayload = { ...payload }
        delete fallbackPayload.emails_sent
        delete fallbackPayload.shipping_cents
        const fallback = await sb.from('orders').insert(fallbackPayload).select('*').maybeSingle()
        if (fallback.error) return { ok: false, error: fallback.error.message }
        if (fallback.data?.id) insertedIds.push(String(fallback.data.id))
        continue
      }
      return { ok: false, error: error.message }
    }
    if (data?.id) insertedIds.push(String(data.id))
  }

  let importedOrders: AdminOrder[] = []
  if (insertedIds.length > 0) {
    const { data, error } = await sb.from('orders').select('*').in('id', insertedIds)
    if (error) return { ok: false, error: error.message }
    importedOrders = (data ?? []) as AdminOrder[]
  }

  return {
    ok: true,
    scannedSessions: sessions.length,
    eligibleSessions: eligible.length,
    existingSessions: existingSessionIds.size,
    importedCount: insertedIds.length,
    skippedNoLineItems,
    importedOrders,
  }
}
