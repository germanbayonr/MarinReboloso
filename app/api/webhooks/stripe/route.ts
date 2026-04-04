import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendNewOrderNotification, sendOrderConfirmation, type OrderEmailData, type OrderEmailItem } from '@/lib/email/order-emails'

function stripeClient() {
  const key =
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.NEXT_STRIPE_SECRET_KEY ||
    ''
  if (!key) return null
  return new Stripe(key)
}

function shortRef(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '')
  if (cleaned.length <= 10) return cleaned.toUpperCase()
  return cleaned.slice(-10).toUpperCase()
}

async function bestEffortUpsertOrder({
  supabase,
  payload,
  sessionId,
}: {
  supabase: ReturnType<typeof createSupabaseServerClient>
  payload: Record<string, unknown>
  sessionId: string
}) {
  let current = { ...payload }

  for (let i = 0; i < 8; i++) {
    const res = await supabase.from('orders').insert(current).select('id,order_number').maybeSingle()
    if (!res.error) return res.data as any

    const msg = String(res.error.message ?? '')
    const missingColMatch =
      msg.match(/column \"([a-zA-Z0-9_]+)\" of relation \"orders\" does not exist/i) ||
      msg.match(/Could not find the '([a-zA-Z0-9_]+)' column/i)
    if (missingColMatch?.[1]) {
      const col = missingColMatch[1]
      if (col in current) {
        const { [col]: _removed, ...rest } = current
        current = rest
        continue
      }
    }

    const duplicate = msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')
    if (duplicate) {
      const existing = await supabase
        .from('orders')
        .select('id,order_number,created_at')
        .eq('stripe_session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (existing.data) return existing.data as any
    }

    break
  }

  return null
}

/** Construye items_json alineado con el catálogo Supabase (mismas fotos y nombres que la web). */
async function buildStripeOrderItemsPayload(
  stripe: Stripe,
  sessionId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>,
): Promise<{ items_json: Record<string, unknown>[]; line_summary: string; customer_name: string | null } | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price'],
  })
  const lineItems = session.line_items?.data ?? []
  if (lineItems.length === 0) return null

  const priceIds = [...new Set(lineItems.map((li) => li.price?.id).filter(Boolean) as string[])]
  if (priceIds.length === 0) return null

  const { data: products, error } = await supabase
    .from('products')
    .select('id,name,price,image_url,stripe_price_id')
    .in('stripe_price_id', priceIds)

  if (error) {
    console.error('[stripe webhook] products:', error.message)
  }

  const byStripePrice = new Map(
    (products ?? [])
      .filter((p: { stripe_price_id?: string | null }) => Boolean(p?.stripe_price_id))
      .map((p: { stripe_price_id?: string | null }) => [String(p.stripe_price_id), p]),
  )

  const items: Record<string, unknown>[] = []
  const names: string[] = []
  for (const li of lineItems) {
    const priceStripeId = li.price?.id ? String(li.price.id) : null
    const qty = typeof li.quantity === 'number' ? li.quantity : 1
    const lineAmountEur = typeof li.amount_total === 'number' ? li.amount_total / 100 : null
    const pr = priceStripeId ? byStripePrice.get(priceStripeId) : undefined
    if (pr && typeof pr === 'object' && 'id' in pr) {
      const prRow = pr as {
        id: string
        name?: string | null
        price?: unknown
        image_url?: string | null
      }
      const unit = typeof prRow.price === 'number' ? prRow.price : Number(prRow.price)
      items.push({
        id: String(prRow.id),
        name: String(prRow.name ?? ''),
        quantity: qty,
        line_total: lineAmountEur ?? (Number.isFinite(unit) ? unit * qty : 0),
        image_url: prRow.image_url ? String(prRow.image_url) : null,
        price: typeof prRow.price === 'number' ? prRow.price : Number(prRow.price),
      })
      names.push(String(prRow.name ?? ''))
    } else {
      items.push({
        name: li.description ?? 'Producto',
        quantity: qty,
        line_total: lineAmountEur,
      })
      names.push(li.description ?? 'Producto')
    }
  }

  const shipName = (session as unknown as { shipping_details?: { name?: string | null } }).shipping_details?.name
  const customer_name = shipName?.trim() || session.customer_details?.name?.trim() || null

  return {
    items_json: items,
    line_summary: names.join(' · '),
    customer_name,
  }
}

async function buildOrderEmailData({
  stripe,
  sessionId,
}: {
  stripe: Stripe
  sessionId: string
}): Promise<OrderEmailData | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })

  const email =
    session.customer_details?.email ||
    session.customer_email ||
    ''

  if (!email) return null

  const lineItems = (session.line_items?.data ?? []) as Stripe.LineItem[]
  const items: OrderEmailItem[] = lineItems.map((li) => {
    const product = li.price?.product as Stripe.Product | string | null
    const name =
      typeof product === 'object' && product && 'name' in product
        ? String((product as any).name ?? '')
        : li.description
          ? String(li.description)
          : 'Producto'

    const unitAmount = typeof li.price?.unit_amount === 'number' ? li.price.unit_amount : null
    const currency = li.price?.currency ? String(li.price.currency) : (session.currency ? String(session.currency) : null)
    return {
      name,
      quantity: typeof li.quantity === 'number' ? li.quantity : 1,
      unitAmount,
      currency,
    }
  })

  return {
    orderReference: shortRef(session.id),
    customerEmail: email,
    items,
    totalAmount: typeof session.amount_total === 'number' ? session.amount_total : null,
    currency: session.currency ? String(session.currency) : null,
  }
}

export async function POST(req: Request) {
  const stripe = stripeClient()
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: false }, { status: 200 })
  }

  const signature = req.headers.get('stripe-signature') || ''
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ received: false }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const sessionId = String(session.id)

  let supabase: ReturnType<typeof createSupabaseServerClient>
  try {
    supabase = createSupabaseServerClient()
  } catch {
    supabase = null as any
  }

  let orderRow: any = null
  if (supabase) {
    let itemsPayload: Awaited<ReturnType<typeof buildStripeOrderItemsPayload>> = null
    try {
      itemsPayload = await buildStripeOrderItemsPayload(stripe, sessionId, supabase)
    } catch (e) {
      console.error('[stripe webhook] buildStripeOrderItemsPayload:', e)
    }

    const totalEur =
      typeof session.amount_total === 'number' ? session.amount_total / 100 : null
    const payload: Record<string, unknown> = {
      stripe_session_id: sessionId,
      stripe_event_id: event.id,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
      total_amount: totalEur,
      currency: session.currency ?? null,
      status: 'pendiente',
      emails_sent: false,
    }
    if (itemsPayload) {
      payload.items_json = itemsPayload.items_json
      payload.line_summary = itemsPayload.line_summary
      if (itemsPayload.customer_name) {
        payload.customer_name = itemsPayload.customer_name
      }
    }
    orderRow = await bestEffortUpsertOrder({ supabase, payload, sessionId })
  }

  const orderEmailData = await buildOrderEmailData({ stripe, sessionId })
  if (!orderEmailData) {
    return NextResponse.json({ received: true })
  }

  const orderReference =
    (orderRow && (orderRow.order_number || orderRow.id) ? String(orderRow.order_number || orderRow.id) : null) ||
    orderEmailData.orderReference

  const finalOrder: OrderEmailData = { ...orderEmailData, orderReference }

  try {
    await Promise.all([sendOrderConfirmation(finalOrder), sendNewOrderNotification(finalOrder)])
    if (supabase && orderRow?.id) {
      await supabase
        .from('orders')
        .update({ emails_sent: true })
        .eq('id', String(orderRow.id))
    }
  } catch {
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}

