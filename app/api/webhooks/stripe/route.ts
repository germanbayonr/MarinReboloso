import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { revalidatePath } from 'next/cache'
import { getServiceSupabase } from '@/lib/admin/server'
import type { AdminOrder } from '@/lib/admin/types'
import { buildOrderLinesForEmail } from '@/lib/mail/build-order-email-lines'
import { getOrderConfirmationTemplate, getOrderEmailSubject } from '@/lib/mail/templates'
import { getPublicSiteBaseUrl } from '@/lib/mail/site-url'
import { sendMareboMailResult } from '@/lib/mail/send'

export const dynamic = 'force-dynamic'

function webhookLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>,
) {
  const payload = data ? JSON.stringify(data) : ''
  if (level === 'error') {
    console.error('[stripe webhook]', message, payload)
    return
  }
  if (level === 'warn') {
    console.warn('[stripe webhook]', message, payload)
    return
  }
  console.log('[stripe webhook]', message, payload)
}

/**
 * Firma del webhook: **solo** STRIPE_WEBHOOK_SECRET (whsec_…) vía
 * `stripe.webhooks.constructEvent`. No reutilices la secret key de API.
 */
function stripeWebhookSecret(): string {
  return String(process.env.STRIPE_WEBHOOK_SECRET ?? '').trim()
}

function stripeSecretKey(): string {
  return (
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.NEXT_STRIPE_SECRET_KEY ||
    ''
  ).trim()
}

function stripeSecretMode(secret: string): 'live' | 'test' | 'unknown' {
  if (secret.startsWith('sk_live_')) return 'live'
  if (secret.startsWith('sk_test_')) return 'test'
  return 'unknown'
}

function isEventModeMismatched(event: Stripe.Event, secret: string): boolean {
  const mode = stripeSecretMode(secret)
  if (mode === 'unknown') return false
  return event.livemode !== (mode === 'live')
}

function shortOrderRef(orderId: string) {
  return orderId.replace(/-/g, '').slice(0, 10).toUpperCase()
}

/** Alineado con admin: image_url string o array de URLs. */
function normalizeProductImageUrl(raw: unknown): string | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t || null
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') {
        const t = item.trim()
        if (t) return t
      }
    }
    return null
  }
  return null
}

function stripeProductImage(product: Stripe.Product | null): string | null {
  const first = product?.images?.[0]
  return typeof first === 'string' && first.trim() ? first.trim() : null
}

/**
 * Inserta pedido probando columnas opcionales (stripe_event_id, emails_sent, shipping_cents)
 * por si el remoto no tiene todas las migraciones.
 */
async function insertOrderRow(
  supabase: ReturnType<typeof getServiceSupabase>,
  base: Record<string, unknown>,
): Promise<{ id: string } | null> {
  let current = { ...base }

  for (let i = 0; i < 10; i++) {
    const res = await supabase.from('orders').insert(current).select('id').maybeSingle()
    if (!res.error && res.data?.id) {
      return { id: String(res.data.id) }
    }

    const msg = String(res.error?.message ?? '')
    const missingColMatch =
      msg.match(/column \"([a-zA-Z0-9_]+)\" of relation \"orders\" does not exist/i) ||
      msg.match(/Could not find the '([a-zA-Z0-9_]+)' column/i)
    if (missingColMatch?.[1]) {
      const col = missingColMatch[1]
      if (col in current) {
        const { [col]: _r, ...rest } = current
        current = rest
        continue
      }
    }

    console.error('[stripe webhook] insert orders:', res.error?.message)
    return null
  }

  return null
}

async function findOrderIdByStripeEventId(
  supabase: ReturnType<typeof getServiceSupabase>,
  eventId: string,
): Promise<string | null> {
  const res = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_event_id', eventId)
    .maybeSingle()

  if (!res.error && res.data?.id) return String(res.data.id)
  if (!res.error) return null

  const msg = String(res.error.message ?? '')
  if (
    msg.includes("Could not find the 'stripe_event_id' column") ||
    (msg.includes('column') && msg.includes('stripe_event_id') && msg.includes('does not exist'))
  ) {
    return null
  }

  webhookLog('warn', 'Error comprobando idempotencia por stripe_event_id', { eventId, error: msg })
  return null
}

async function buildItemsAndSummary(
  stripe: Stripe,
  sessionId: string,
  supabase: ReturnType<typeof getServiceSupabase>,
): Promise<{
  session: Stripe.Checkout.Session
  items_json: Record<string, unknown>[]
  line_summary: string
  customer_name: string | null
} | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'line_items.data.price.product'],
  })

  const lineItems = session.line_items?.data ?? []
  if (lineItems.length === 0) {
    console.warn('[stripe webhook] Sesión sin line_items')
    return null
  }

  const priceIds = [...new Set(lineItems.map((li) => li.price?.id).filter(Boolean) as string[])]

  type ProductRow = { id: string; name: string | null; price: unknown; image_url: string | null }

  const byStripePrice = new Map<string, ProductRow>()

  if (priceIds.length > 0) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id,name,price,image_url,stripe_price_id')
      .in('stripe_price_id', priceIds)

    if (error) {
      console.error('[stripe webhook] Catálogo Supabase:', error.message)
    }

    for (const p of products ?? []) {
      const row = p as {
        id: string
        name?: string | null
        price?: unknown
        image_url?: string | null
        stripe_price_id?: string | null
      }
      if (row.stripe_price_id) {
        byStripePrice.set(String(row.stripe_price_id), {
          id: String(row.id),
          name: row.name ?? null,
          price: row.price,
          image_url: row.image_url ?? null,
        })
      }
    }
  }

  const summaryParts: string[] = []
  const items: Record<string, unknown>[] = []

  for (const li of lineItems) {
    const qty = typeof li.quantity === 'number' && li.quantity > 0 ? li.quantity : 1
    const lineCents =
      typeof li.amount_total === 'number' ? li.amount_total : typeof li.amount_subtotal === 'number' ? li.amount_subtotal : 0
    const lineEur = lineCents / 100

    const priceObj = li.price
    const price = priceObj && typeof priceObj === 'object' && 'id' in priceObj ? (priceObj as Stripe.Price) : null
    const priceId = price?.id ? String(price.id) : null

    const rawProduct = price?.product
    const product = rawProduct && typeof rawProduct === 'object' && 'name' in rawProduct ? (rawProduct as Stripe.Product) : null

    const stripeImg = stripeProductImage(product)
    const descName = li.description?.trim() || product?.name?.trim() || 'Producto'

    const pr = priceId ? byStripePrice.get(priceId) : undefined
    if (pr) {
      const unit = typeof pr.price === 'number' ? pr.price : Number(pr.price)
      const dbImg = normalizeProductImageUrl(pr.image_url)
      items.push({
        id: String(pr.id),
        name: String(pr.name ?? descName),
        quantity: qty,
        line_total: Number.isFinite(lineEur) ? lineEur : Number.isFinite(unit) ? unit * qty : 0,
        image_url: dbImg || stripeImg,
        price: Number.isFinite(unit) ? unit : lineEur / Math.max(1, qty),
        stripe_price_id: priceId,
      })
      summaryParts.push(`${qty}× ${String(pr.name ?? descName)}`)
    } else {
      const unitCents = typeof price?.unit_amount === 'number' ? price.unit_amount : Math.round(lineCents / qty)
      const unitEur = unitCents / 100
      items.push({
        name: descName,
        quantity: qty,
        line_total: Number.isFinite(lineEur) ? lineEur : unitEur * qty,
        image_url: stripeImg,
        price: unitEur,
        stripe_price_id: priceId,
      })
      summaryParts.push(`${qty}× ${descName}`)
    }
  }

  const shipBlock = shippingBlockFromSession(session)
  const shipName = shipBlock?.name?.trim()
  const customer_name = shipName || session.customer_details?.name?.trim() || null

  return {
    session,
    items_json: items,
    line_summary: summaryParts.join(' · '),
    customer_name,
  }
}

/** Stripe tipa distintas versiones de API; el checkout suele exponer dirección en shipping_details o shipping. */
function shippingBlockFromSession(session: Stripe.Checkout.Session) {
  const s = session as Stripe.Checkout.Session & {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null }
    shipping?: { name?: string | null; address?: Stripe.Address | null }
  }
  return s.shipping_details ?? s.shipping ?? null
}

function shippingFieldsFromSession(session: Stripe.Checkout.Session) {
  const block = shippingBlockFromSession(session)
  const addr = block?.address
  return {
    shipping_address: addr?.line1?.trim() || null,
    shipping_city: addr?.city?.trim() || null,
    shipping_postal_code: addr?.postal_code?.trim() || null,
    shipping_country: addr?.country?.trim() || null,
  }
}

async function sendCustomerConfirmationMail(orderId: string, orderRow: AdminOrder, customerName: string) {
  const siteUrl = getPublicSiteBaseUrl()
  const orderRef = shortOrderRef(orderId)
  const pack = await buildOrderLinesForEmail(orderRow)
  const html = getOrderConfirmationTemplate({
    customerName: customerName.trim() || 'Cliente',
    siteUrl,
    orderId,
    orderRef,
    ...pack,
  })

  const to = (orderRow.customer_email ?? '').trim()
  if (!to) {
    console.warn('[stripe webhook] Sin email de cliente; no se envía confirmación')
    return { ok: false as const, error: 'Sin email' }
  }

  const subject = getOrderEmailSubject('En preparación', customerName.trim() || 'Cliente')
  const result = await sendMareboMailResult({ to, subject, html })
  return result
}

async function sendShopNotificationMail(orderRow: AdminOrder, customerName: string, orderRef: string) {
  const to = (process.env.ORDERS_NOTIFICATION_EMAIL || 'marebo.meri@gmail.com').trim()
  const email = (orderRow.customer_email ?? '').trim()
  const lines =
    Array.isArray(orderRow.items_json) && orderRow.items_json.length > 0
      ? (orderRow.items_json as { name?: string; quantity?: number }[])
          .map((i) => `<li>${String(i.name ?? 'Pieza')} ×${Number(i.quantity ?? 1)}</li>`)
          .join('')
      : `<li>${orderRow.line_summary ?? 'Pedido'}</li>`

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#111;">
      <h2 style="margin:0 0 12px;">Nuevo pedido (Stripe)</h2>
      <p><strong>Ref:</strong> ${orderRef}</p>
      <p><strong>Cliente:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${email || '—'}</p>
      <p><strong>Total:</strong> ${orderRow.total_amount ?? '—'} ${orderRow.currency ?? ''}</p>
      <ul>${lines}</ul>
    </div>
  `

  return sendMareboMailResult({
    to,
    subject: `Nuevo pedido · ${orderRef}`,
    html,
  })
}

export async function POST(req: Request) {
  const secret = stripeSecretKey()
  const webhookSecret = stripeWebhookSecret()

  if (!secret) {
    webhookLog('error', 'Falta STRIPE_SECRET_KEY (API) para ampliar sesiones')
    return NextResponse.json({ error: 'Stripe API no configurada' }, { status: 503 })
  }

  if (!webhookSecret) {
    webhookLog('error', 'Falta STRIPE_WEBHOOK_SECRET para validar la firma del webhook')
    return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 503 })
  }

  const stripe = new Stripe(secret)

  const signature = req.headers.get('stripe-signature') || ''
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (e) {
    webhookLog('error', 'Firma inválida (STRIPE_WEBHOOK_SECRET incorrecto o cuerpo alterado)', {
      error: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  webhookLog('info', 'Webhook recibido', {
    eventType: event.type,
    eventId: event.id,
    livemode: event.livemode,
    secretMode: stripeSecretMode(secret),
  })

  if (isEventModeMismatched(event, secret)) {
    webhookLog('warn', 'Evento ignorado por mismatch live/test entre evento y STRIPE_SECRET_KEY', {
      eventId: event.id,
      eventType: event.type,
      eventLivemode: event.livemode,
      secretMode: stripeSecretMode(secret),
    })
    return NextResponse.json({ received: true, ignored: 'livemode-mismatch' })
  }

  if (event.type !== 'checkout.session.completed') {
    webhookLog('info', 'Evento ignorado: tipo no soportado', { eventType: event.type, eventId: event.id })
    return NextResponse.json({ received: true })
  }

  const sessionThin = event.data.object as Stripe.Checkout.Session
  const sessionId = String(sessionThin.id)

  /** RLS: los compradores no están logueados; solo la service role puede insertar en `orders`. */
  let supabase: ReturnType<typeof getServiceSupabase>
  try {
    supabase = getServiceSupabase()
  } catch (e) {
    webhookLog('error', 'Supabase: falta SUPABASE_SERVICE_ROLE_KEY o URL', {
      error: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const byEventId = await findOrderIdByStripeEventId(supabase, event.id)
  if (byEventId) {
    webhookLog('info', 'Evento ya procesado (idempotencia por event id)', {
      eventId: event.id,
      orderId: byEventId,
    })
    return NextResponse.json({ received: true, duplicate: true, orderId: byEventId })
  }

  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (existing?.id) {
    webhookLog('info', 'Pedido ya existía para session id', {
      eventId: event.id,
      sessionId,
      orderId: existing.id,
    })
    return NextResponse.json({ received: true, duplicate: true })
  }

  let built: Awaited<ReturnType<typeof buildItemsAndSummary>>
  try {
    built = await buildItemsAndSummary(stripe, sessionId, supabase)
  } catch (e) {
    webhookLog('error', 'Error recuperando sesión / líneas', {
      eventId: event.id,
      sessionId,
      error: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ error: 'retrieve failed' }, { status: 500 })
  }

  if (!built) {
    webhookLog('error', 'No se pudieron construir line_items', { eventId: event.id, sessionId })
    return NextResponse.json({ error: 'No line items' }, { status: 500 })
  }

  const session = built.session

  const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : null
  const totalEur = amountTotal != null ? amountTotal / 100 : null

  const customer_email =
    (session.customer_details?.email || session.customer_email || '').trim() || null

  const customer_name = built.customer_name || session.customer_details?.name?.trim() || null

  const shipping = shippingFieldsFromSession(session)
  const shippingCents =
    session.shipping_cost && typeof session.shipping_cost.amount_total === 'number'
      ? session.shipping_cost.amount_total
      : null

  const payload: Record<string, unknown> = {
    stripe_session_id: sessionId,
    stripe_event_id: event.id,
    customer_email,
    customer_name,
    total_amount: totalEur,
    currency: (session.currency || 'eur').toLowerCase(),
    status: 'pendiente',
    line_summary: built.line_summary,
    items_json: built.items_json,
    emails_sent: false,
    ...shipping,
  }

  if (shippingCents != null) {
    payload.shipping_cents = shippingCents
  }

  const inserted = await insertOrderRow(supabase, payload)
  if (!inserted?.id) {
    webhookLog('error', 'Fallo insertando pedido en orders', { eventId: event.id, sessionId })
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  webhookLog('info', 'Pedido guardado en DB', {
    eventId: event.id,
    sessionId,
    orderId: inserted.id,
    customerEmail: customer_email || null,
  })
  revalidatePath('/admin')
  revalidatePath('/admin/pedidos')

  const { data: orderRow, error: readErr } = await supabase.from('orders').select('*').eq('id', inserted.id).maybeSingle()

  if (readErr || !orderRow) {
    webhookLog('error', 'No se pudo releer pedido tras insert', {
      eventId: event.id,
      orderId: inserted.id,
      error: readErr?.message ?? null,
    })
    return NextResponse.json({ received: true, warning: 'no read order' })
  }

  const row = orderRow as AdminOrder
  const displayName = customer_name || row.customer_name || 'Cliente'
  const orderRef = shortOrderRef(inserted.id)

  const mail = await sendCustomerConfirmationMail(inserted.id, row, displayName)
  if (mail.ok) {
    webhookLog('info', 'Correo cliente enviado', { eventId: event.id, orderId: inserted.id })
  } else {
    webhookLog('error', 'Fallo correo cliente', {
      eventId: event.id,
      orderId: inserted.id,
      error: mail.error,
    })
  }

  const internal = await sendShopNotificationMail(row, displayName, orderRef)
  if (!internal.ok) {
    webhookLog('error', 'Fallo correo tienda', {
      eventId: event.id,
      orderId: inserted.id,
      error: internal.error,
    })
  }

  if (mail.ok) {
    const { error: upErr } = await supabase.from('orders').update({ emails_sent: true }).eq('id', inserted.id)
    if (upErr) {
      webhookLog('warn', 'No se pudo marcar emails_sent (¿columna ausente?)', {
        eventId: event.id,
        orderId: inserted.id,
        error: upErr.message,
      })
    }
  }

  return NextResponse.json({ received: true, orderId: inserted.id })
}
