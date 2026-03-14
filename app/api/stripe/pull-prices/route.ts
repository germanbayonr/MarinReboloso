import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripeClient() {
  const key =
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.NEXT_STRIPE_SECRET_KEY ||
    ''
  if (!key) return null
  return new Stripe(key)
}

function getSupabaseServiceClient() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key =
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '').trim()

  if (!url || !key) return null

  return createClient(url, key, { auth: { persistSession: false } })
}

async function listAllActiveStripeProducts(stripe: Stripe) {
  const out: Stripe.Product[] = []
  let startingAfter: string | undefined

  while (true) {
    const res = await stripe.products.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.default_price'],
    })
    out.push(...res.data)
    if (!res.has_more) break
    startingAfter = res.data[res.data.length - 1]?.id
    if (!startingAfter) break
  }

  return out
}

async function resolveDefaultPrice(stripe: Stripe, product: Stripe.Product) {
  const dp = product.default_price
  if (!dp) return null
  if (typeof dp === 'string') {
    const price = await stripe.prices.retrieve(dp)
    return price
  }
  return dp as Stripe.Price
}

export async function POST(req: Request) {
  const token = req.headers.get('x-sync-token') || ''
  const requiredToken = process.env.SYNC_TOKEN || 'MareboReverse2026'
  if (token !== requiredToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ success: false, error: 'Stripe not configured' }, { status: 500 })
  }

  const supabase = getSupabaseServiceClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase service_role_key not configured' },
      { status: 500 },
    )
  }

  const products = await listAllActiveStripeProducts(stripe)

  const updated: Array<{
    stripe_product_id: string
    supabase_id: string
    stripe_price_id: string
    price_eur: number
  }> = []
  const errors: Array<{ stripe_product_id: string; reason: string }> = []
  let scanned = 0
  let matched = 0
  let skippedNoMatch = 0
  let skippedNoPrice = 0
  let skippedNonEur = 0

  for (const p of products) {
    scanned += 1
    try {
      const { data: row, error: findError } = await supabase
        .from('products')
        .select('id')
        .eq('stripe_product_id', p.id)
        .maybeSingle()

      if (findError) {
        errors.push({ stripe_product_id: p.id, reason: findError.message })
        continue
      }

      if (!row?.id) {
        skippedNoMatch += 1
        continue
      }
      matched += 1

      const price = await resolveDefaultPrice(stripe, p)
      if (!price?.id) {
        skippedNoPrice += 1
        continue
      }

      const currency = price.currency ? String(price.currency).toLowerCase() : ''
      if (currency && currency !== 'eur') {
        skippedNonEur += 1
        continue
      }

      const unitAmount = typeof price.unit_amount === 'number' ? price.unit_amount : null
      if (unitAmount == null) {
        skippedNoPrice += 1
        continue
      }

      const priceEur = unitAmount / 100
      const { error: updateError } = await supabase
        .from('products')
        .update({
          price: priceEur,
          stripe_price_id: price.id,
        })
        .eq('id', String(row.id))

      if (updateError) {
        errors.push({ stripe_product_id: p.id, reason: updateError.message })
        continue
      }

      updated.push({
        stripe_product_id: p.id,
        supabase_id: String(row.id),
        stripe_price_id: price.id,
        price_eur: priceEur,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error'
      errors.push({ stripe_product_id: p.id, reason: message })
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    scanned,
    matched,
    updatedCount: updated.length,
    skipped: {
      noMatch: skippedNoMatch,
      noDefaultPrice: skippedNoPrice,
      nonEur: skippedNonEur,
    },
    updated,
    errors,
  })
}

