#!/usr/bin/env node
/**
 * Audita que todos los productos activos en Supabase puedan comprarse (Stripe + checkout).
 * Uso:
 *   node --env-file=.env.local scripts/audit-purchasability.mjs
 *   node --env-file=.env.local scripts/audit-purchasability.mjs --apply
 */
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const apply = process.argv.includes('--apply')

function env(name, fallbacks = []) {
  for (const key of [name, ...fallbacks]) {
    const v = process.env[key]
    if (v?.trim()) return v.trim()
  }
  return ''
}

const supabaseUrl = env('SUPABASE_URL', ['NEXT_PUBLIC_SUPABASE_URL'])
const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE'])
const stripeKey = env('STRIPE_SECRET_KEY', ['STRIPE_API_KEY', 'STRIPE_SECRET', 'NEXT_STRIPE_SECRET_KEY'])

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!stripeKey) {
  console.error('❌ Falta STRIPE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
const stripe = new Stripe(stripeKey)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function unitAmountFromPrice(price) {
  return Math.round(Number(price) * 100)
}

function firstImageUrl(imageUrl) {
  if (typeof imageUrl === 'string' && imageUrl.trim()) return imageUrl.trim()
  if (Array.isArray(imageUrl)) {
    const first = imageUrl.find((item) => typeof item === 'string' && item.trim())
    return first ? String(first).trim() : null
  }
  return null
}

async function ensureStripePriceForProduct(product) {
  const expectedUnitAmount = unitAmountFromPrice(product.price)
  if (!Number.isFinite(expectedUnitAmount) || expectedUnitAmount <= 0) return null

  let stripeProductId = product.stripe_product_id ? String(product.stripe_product_id) : ''
  let stripePriceId = product.stripe_price_id ? String(product.stripe_price_id) : ''

  if (stripePriceId) {
    try {
      const current = await stripe.prices.retrieve(stripePriceId, { expand: ['product'] })
      const linkedProductId =
        typeof current.product === 'string' ? current.product : current.product?.id ?? ''
      if (linkedProductId) stripeProductId = linkedProductId

      const stripeProduct =
        typeof current.product === 'string'
          ? await stripe.products.retrieve(current.product)
          : current.product
      const productActive =
        Boolean(stripeProduct) &&
        !('deleted' in stripeProduct && stripeProduct.deleted) &&
        stripeProduct.active !== false

      const priceMatches =
        current.active &&
        current.currency === 'eur' &&
        current.unit_amount === expectedUnitAmount &&
        !current.recurring

      if (priceMatches && productActive) return stripePriceId

      if (priceMatches && linkedProductId) {
        await stripe.products.update(linkedProductId, {
          active: true,
          name: String(product.name ?? 'Producto Marebo').trim() || 'Producto Marebo',
        })
        return stripePriceId
      }
    } catch {
      stripePriceId = ''
    }
  }

  if (!stripeProductId) {
    const createdProduct = await stripe.products.create({
      name: String(product.name ?? 'Producto Marebo').trim() || 'Producto Marebo',
      description: product.description?.trim() || undefined,
      images: (() => {
        const url = firstImageUrl(product.image_url)
        return url ? [url] : undefined
      })(),
      active: true,
    })
    stripeProductId = createdProduct.id
  }

  const freshPrice = await stripe.prices.create({
    product: stripeProductId,
    unit_amount: expectedUnitAmount,
    currency: 'eur',
  })

  await supabase
    .from('products')
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: freshPrice.id,
    })
    .eq('id', product.id)

  try {
    await stripe.products.update(stripeProductId, {
      name: String(product.name ?? 'Producto Marebo').trim() || 'Producto Marebo',
      active: true,
    })
  } catch {}

  return freshPrice.id
}

async function loadProducts() {
  const pageSize = 1000
  const out = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,price,description,image_url,is_active,in_stock,stripe_product_id,stripe_price_id')
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + pageSize - 1)
    if (error) throw new Error(error.message)
    const batch = data ?? []
    out.push(...batch)
    if (batch.length < pageSize) break
    offset += pageSize
  }
  return out
}

async function validateStripePrice(product) {
  const priceEur = Number(product.price)
  if (!product.stripe_price_id) return { ok: false, issue: 'Sin stripe_price_id' }

  try {
    const sp = await stripe.prices.retrieve(String(product.stripe_price_id), { expand: ['product'] })
    if (!sp.active) return { ok: false, issue: 'Precio inactivo' }
    if (sp.currency !== 'eur') return { ok: false, issue: `Moneda ${sp.currency}` }
    if (sp.recurring) return { ok: false, issue: 'Precio recurrente' }
    const stripeProduct = typeof sp.product === 'string' ? await stripe.products.retrieve(sp.product) : sp.product
    if (!stripeProduct?.active) return { ok: false, issue: 'Producto Stripe inactivo' }
    const expected = unitAmountFromPrice(priceEur)
    if (sp.unit_amount !== expected) {
      return {
        ok: false,
        issue: `Importe ${(sp.unit_amount ?? 0) / 100}€ ≠ ${priceEur}€ en Supabase`,
      }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, issue: e instanceof Error ? e.message : String(e) }
  }
}

async function simulateCheckout(product) {
  const issues = []
  if (!UUID_RE.test(String(product.id))) issues.push('id no UUID')
  if (product.in_stock === false) issues.push('sin stock')
  const price = Number(product.price)
  if (!Number.isFinite(price) || price <= 0) issues.push('precio inválido')
  if (!product.stripe_price_id) issues.push('sin stripe_price_id para line_items')
  return issues
}

async function main() {
  console.log(`\n🔍 Auditoría de comprabilidad (${apply ? 'modo reparación' : 'solo lectura'})\n`)

  const products = await loadProducts()
  const purchasable = products.filter((p) => p.in_stock !== false)
  console.log(`Productos activos: ${products.length} | En stock: ${purchasable.length}\n`)

  const failures = []
  let fixed = 0

  for (const product of purchasable) {
    const name = String(product.name ?? '').trim() || '(sin nombre)'
    let row = product
    const preIssues = await simulateCheckout(row)
    const initialStripeCheck = await validateStripePrice(row)
    const needsStripeRepair =
      preIssues.some((i) => i.includes('stripe') || i.includes('UUID')) ||
      !initialStripeCheck.ok

    if (apply && needsStripeRepair) {
      try {
        const ensured = await ensureStripePriceForProduct(row)
        if (ensured) {
          const { data: refreshed } = await supabase
            .from('products')
            .select('stripe_product_id,stripe_price_id')
            .eq('id', product.id)
            .maybeSingle()
          if (refreshed) {
            row = {
              ...row,
              stripe_product_id: refreshed.stripe_product_id,
              stripe_price_id: refreshed.stripe_price_id,
            }
          } else {
            row = { ...row, stripe_price_id: ensured }
          }
          fixed += 1
        }
      } catch (e) {
        failures.push({ name, id: product.id, issues: [e instanceof Error ? e.message : String(e)] })
        continue
      }
    }

    const checkoutIssues = await simulateCheckout(row)
    const stripeCheck = await validateStripePrice(row)
    const allIssues = [...checkoutIssues]
    if (!stripeCheck.ok) allIssues.push(stripeCheck.issue)

    if (allIssues.length > 0) {
      failures.push({ name, id: row.id, issues: allIssues })
      console.log(`✗ ${name}`)
      for (const issue of allIssues) console.log(`    · ${issue}`)
    } else {
      console.log(`✓ ${name}`)
    }
  }

  const inactive = products.filter((p) => p.in_stock === false)
  if (inactive.length > 0) {
    console.log(`\n⏸ ${inactive.length} productos activos pero sin stock (no auditados para checkout).`)
  }

  console.log('\n--- Resumen ---')
  console.log(`Comprables verificados: ${purchasable.length - failures.length}/${purchasable.length}`)
  if (apply) console.log(`Reparados en esta pasada: ${fixed}`)
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} producto(s) con problemas:`)
    for (const f of failures) {
      console.log(`  - ${f.name} (${f.id}): ${f.issues.join('; ')}`)
    }
    process.exitCode = 1
  } else {
    console.log('\n✅ Todos los productos en stock están listos para checkout (sin realizar compra).')
  }
}

main().catch((e) => {
  console.error('Error fatal:', e)
  process.exit(1)
})
