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

function getSupabaseServiceClient(): any {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key =
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '').trim()

  if (!url || !key) return null

  return createClient(url, key, { auth: { persistSession: false } })
}

function normalizeName(value: string) {
  return value.trim().toLowerCase()
}

function isValidImageUrl(value: unknown) {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  if (!v.startsWith('http://') && !v.startsWith('https://')) return false
  return true
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

async function listAllSupabaseProducts(supabase: any) {
  const pageSize = 1000
  const out: any[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,price,description,image_url,stripe_product_id,stripe_price_id')
      .range(offset, offset + pageSize - 1)

    if (error) throw new Error(error.message)
    const batch = data ?? []
    out.push(...batch)
    if (batch.length < pageSize) break
    offset += pageSize
    if (offset > 20000) break
  }

  return out
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

  const stripeProducts = await listAllActiveStripeProducts(stripe)
  const supabaseProducts = await listAllSupabaseProducts(supabase)

  const byName = new Map<string, any>()
  const duplicates = new Set<string>()

  for (const p of supabaseProducts) {
    const name = normalizeName(String(p?.name ?? ''))
    if (!name) continue
    if (byName.has(name)) duplicates.add(name)
    else byName.set(name, p)
  }

  const updated_successfully: Array<{
    stripe_product_id: string
    stripe_price_id: string | null
    supabase_id: string
    name: string
    price: number | null
    updatedSupabase: boolean
    updatedStripeImages: boolean
  }> = []
  const not_found_in_supabase: Array<{ stripe_product_id: string; name: string }> = []
  const errors: Array<{ stripe_product_id: string; name: string; reason: string }> = []

  let scannedStripe = 0
  let matchedByName = 0
  let updatedSupabaseCount = 0
  let updatedStripeCount = 0
  let skippedDuplicateName = 0
  let skippedNoDefaultPrice = 0
  let skippedNonEur = 0

  for (const sp of stripeProducts) {
    scannedStripe += 1
    const stripeName = String(sp.name ?? '').trim()
    const key = normalizeName(stripeName)

    if (!key) {
      errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Stripe product has empty name' })
      continue
    }

    if (duplicates.has(key)) {
      skippedDuplicateName += 1
      errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Duplicate name in Supabase' })
      continue
    }

    const db = byName.get(key)
    if (!db?.id) {
      not_found_in_supabase.push({ stripe_product_id: sp.id, name: stripeName })
      continue
    }

    matchedByName += 1

    try {
      const price = await resolveDefaultPrice(stripe, sp)
      if (!price?.id) {
        skippedNoDefaultPrice += 1
        errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Missing default_price' })
        continue
      }

      const currency = price.currency ? String(price.currency).toLowerCase() : ''
      if (currency && currency !== 'eur') {
        skippedNonEur += 1
        errors.push({ stripe_product_id: sp.id, name: stripeName, reason: `Unsupported currency: ${currency}` })
        continue
      }

      const unitAmount = typeof price.unit_amount === 'number' ? price.unit_amount : null
      if (unitAmount == null) {
        skippedNoDefaultPrice += 1
        errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Missing unit_amount' })
        continue
      }

      const nextPrice = unitAmount / 100
      const nextDescription = typeof sp.description === 'string' ? sp.description : null

      const { error: updateError } = await supabase
        .from('products')
        .update({
          price: nextPrice,
          description: nextDescription,
          stripe_product_id: sp.id,
          stripe_price_id: price.id,
        })
        .eq('id', String(db.id))

      if (updateError) {
        errors.push({ stripe_product_id: sp.id, name: stripeName, reason: updateError.message })
        continue
      }

      updatedSupabaseCount += 1

      let updatedStripeImages = false
      if (isValidImageUrl(db.image_url)) {
        try {
          await stripe.products.update(sp.id, { images: [String(db.image_url).trim()] })
          updatedStripeImages = true
          updatedStripeCount += 1
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Stripe update failed'
          errors.push({ stripe_product_id: sp.id, name: stripeName, reason: message })
        }
      }

      updated_successfully.push({
        stripe_product_id: sp.id,
        stripe_price_id: price.id,
        supabase_id: String(db.id),
        name: stripeName,
        price: nextPrice,
        updatedSupabase: true,
        updatedStripeImages,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error'
      errors.push({ stripe_product_id: sp.id, name: stripeName, reason: message })
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    stats: {
      stripeProducts: stripeProducts.length,
      supabaseProducts: supabaseProducts.length,
      scannedStripe,
      matchedByName,
      updatedSupabaseCount,
      updatedStripeCount,
      skippedDuplicateName,
      skippedNoDefaultPrice,
      skippedNonEur,
    },
    updated_successfully,
    not_found_in_supabase,
    errors,
  })
}
