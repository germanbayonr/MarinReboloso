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

function normalizeSoft(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
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

async function resolvePriceWithFallback(stripe: Stripe, product: Stripe.Product) {
  const defaultPrice = await resolveDefaultPrice(stripe, product)
  if (defaultPrice?.id) {
    return { price: defaultPrice, usedFallback: false }
  }

  const list = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 1,
  })
  const fallback = list.data?.[0] ?? null
  if (!fallback?.id) return { price: null, usedFallback: false }

  try {
    await stripe.products.update(product.id, { default_price: fallback.id })
  } catch {}

  return { price: fallback, usedFallback: true }
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
  const supabaseCandidates: Array<{ id: string; name: string; soft: string; raw: any }> = []

  for (const p of supabaseProducts) {
    const rawName = String(p?.name ?? '').trim()
    const exact = normalizeName(rawName)
    if (!exact) continue
    if (byName.has(exact)) {
      duplicates.add(exact)
      continue
    }
    byName.set(exact, p)
    const id = p?.id ? String(p.id) : ''
    const soft = normalizeSoft(rawName)
    if (id && soft && soft.length >= 8) {
      supabaseCandidates.push({ id, name: rawName, soft, raw: p })
    }
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
  const soft_matched_and_renamed: Array<{
    stripe_product_id: string
    supabase_id: string
    stripe_name_before: string
    stripe_name_after: string
  }> = []
  const errors: Array<{ stripe_product_id: string; name: string; reason: string }> = []

  const matchedSupabaseIds = new Set<string>()

  let scannedStripe = 0
  let matchedByName = 0
  let updatedSupabaseCount = 0
  let updatedStripeCount = 0
  let skippedDuplicateName = 0
  let skippedNoDefaultPrice = 0
  let skippedNonEur = 0
  let usedFallbackDefaultPrice = 0
  let softMatchedByName = 0
  let renamedStripeCount = 0

  for (const sp of stripeProducts) {
    scannedStripe += 1
    const stripeName = String(sp.name ?? '').trim()
    const key = normalizeName(stripeName)
    const stripeSoft = normalizeSoft(stripeName)

    if (!key) {
      errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Stripe product has empty name' })
      continue
    }

    if (duplicates.has(key)) {
      skippedDuplicateName += 1
      errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Duplicate name in Supabase' })
      continue
    }

    let db = byName.get(key)
    let matchType: 'exact' | 'soft' = 'exact'
    let softMatched = false

    if (!db?.id) {
      if (!stripeSoft || stripeSoft.length < 8) {
        not_found_in_supabase.push({ stripe_product_id: sp.id, name: stripeName })
        continue
      }

      const matches = supabaseCandidates.filter((c) => {
        if (matchedSupabaseIds.has(c.id)) return false
        const a = stripeSoft
        const b = c.soft
        return a.includes(b) || b.includes(a)
      })

      if (matches.length === 1) {
        const candidate = matches[0]
        db = candidate.raw
        matchType = 'soft'
        softMatched = true
        softMatchedByName += 1
      } else if (matches.length > 1) {
        errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Ambiguous soft match' })
        continue
      } else {
        not_found_in_supabase.push({ stripe_product_id: sp.id, name: stripeName })
        continue
      }
    }

    const supabaseId = db?.id ? String(db.id) : ''
    if (!supabaseId) {
      not_found_in_supabase.push({ stripe_product_id: sp.id, name: stripeName })
      continue
    }
    if (matchedSupabaseIds.has(supabaseId)) {
      errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Supabase product already matched' })
      continue
    }

    matchedSupabaseIds.add(supabaseId)
    matchedByName += 1

    try {
      const resolved = await resolvePriceWithFallback(stripe, sp)
      const price = resolved.price
      if (!price?.id) {
        skippedNoDefaultPrice += 1
        errors.push({ stripe_product_id: sp.id, name: stripeName, reason: 'Missing default_price' })
        continue
      }
      if (resolved.usedFallback) usedFallbackDefaultPrice += 1

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
        .eq('id', supabaseId)

      if (updateError) {
        errors.push({ stripe_product_id: sp.id, name: stripeName, reason: updateError.message })
        continue
      }

      updatedSupabaseCount += 1

      let updatedStripeImages = false
      let renamedStripe = false

      const stripeUpdate: Stripe.ProductUpdateParams = {}
      if (softMatched) stripeUpdate.name = String(db.name ?? '').trim()
      if (isValidImageUrl(db.image_url)) stripeUpdate.images = [String(db.image_url).trim()]

      if (Object.keys(stripeUpdate).length > 0) {
        try {
          await stripe.products.update(sp.id, stripeUpdate)
          if (stripeUpdate.images) {
            updatedStripeImages = true
            updatedStripeCount += 1
          }
          if (stripeUpdate.name && stripeUpdate.name !== stripeName) {
            renamedStripe = true
            renamedStripeCount += 1
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Stripe update failed'
          errors.push({ stripe_product_id: sp.id, name: stripeName, reason: message })
        }
      }

      if (softMatched && renamedStripe) {
        soft_matched_and_renamed.push({
          stripe_product_id: sp.id,
          supabase_id: supabaseId,
          stripe_name_before: stripeName,
          stripe_name_after: String(db.name ?? '').trim(),
        })
      }

      updated_successfully.push({
        stripe_product_id: sp.id,
        stripe_price_id: price.id,
        supabase_id: supabaseId,
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
      usedFallbackDefaultPrice,
      softMatchedByName,
      renamedStripeCount,
    },
    updated_successfully,
    soft_matched_and_renamed,
    not_found_in_supabase,
    errors,
  })
}
