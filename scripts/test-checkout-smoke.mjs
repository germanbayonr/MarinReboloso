#!/usr/bin/env node
/**
 * Prueba checkout sin comprar: crea sesiones Stripe vía /api/checkout y las expira al instante.
 * Uso: node --env-file=.env.local scripts/test-checkout-smoke.mjs
 */
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const BASE = process.env.CHECKOUT_SMOKE_BASE_URL ?? 'http://localhost:3000'
const CONCURRENCY = 4

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

if (!supabaseUrl || !serviceKey || !stripeKey) {
  console.error('❌ Faltan credenciales Supabase/Stripe en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
const stripe = new Stripe(stripeKey)

async function loadInStockProducts() {
  const out = []
  let offset = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,stripe_price_id')
      .eq('is_active', true)
      .eq('in_stock', true)
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

function sessionIdFromUrl(url) {
  try {
    const u = new URL(url)
    const path = u.pathname
    const match = path.match(/\/(cs_(?:test|live)_[a-zA-Z0-9]+)/)
    if (match) return match[1]
    const sid = u.searchParams.get('session_id')
    return sid || null
  } catch {
    return null
  }
}

async function testCheckoutForProduct(product) {
  const res = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cartItems: [{ id: product.id, quantity: 1 }],
      customer: { email: 'smoke-test@marebo.local' },
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
  }
  if (!body?.url) throw new Error('Respuesta sin url de Stripe')
  const sessionId = sessionIdFromUrl(body.url)
  if (sessionId) {
    try {
      await stripe.checkout.sessions.expire(sessionId)
    } catch {
      // Sesión ya expirada o modo test — no bloquear
    }
  }
  return body.url
}

async function runPool(items, worker) {
  const failures = []
  let index = 0
  let ok = 0

  async function next() {
    while (index < items.length) {
      const i = index++
      const item = items[i]
      try {
        await worker(item)
        ok += 1
        process.stdout.write(`\r✓ ${ok}/${items.length} sesiones checkout OK`)
      } catch (e) {
        failures.push({
          id: item.id,
          name: item.name,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => next()))
  console.log('')
  return { ok, failures }
}

async function main() {
  console.log(`\n🧪 Smoke test checkout (sin compra) → ${BASE}\n`)

  try {
    const health = await fetch(BASE, { method: 'HEAD' })
    if (!health.ok && health.status !== 405) {
      console.warn(`⚠ Servidor respondió ${health.status}; continuando igualmente…`)
    }
  } catch {
    console.error(`❌ No se puede conectar a ${BASE}. Arranca con npm run dev`)
    process.exit(1)
  }

  const products = await loadInStockProducts()
  console.log(`Productos en stock a probar: ${products.length}\n`)

  const { ok, failures } = await runPool(products, testCheckoutForProduct)

  console.log('\n--- Resumen smoke test ---')
  console.log(`Sesiones creadas y expiradas: ${ok}/${products.length}`)

  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} fallo(s):`)
    for (const f of failures.slice(0, 20)) {
      console.log(`  - ${f.name} (${f.id}): ${f.error}`)
    }
    if (failures.length > 20) console.log(`  … y ${failures.length - 20} más`)
    process.exitCode = 1
  } else {
    console.log('\n✅ Todos los productos en stock generan sesión de checkout válida.')
  }
}

main().catch((e) => {
  console.error('Error fatal:', e)
  process.exit(1)
})
