/**
 * Comprueba mutaciones críticas del admin contra Supabase (service role).
 * No usa Next: valida la misma lógica que order-mutations / product-delete-server.
 *
 * Uso: node --env-file=.env.local scripts/verify-admin-mutations.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!url || !key) {
  console.error('Faltan SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function testOrderStatusRoundTrip() {
  const { data: order, error } = await sb
    .from('orders')
    .select('id, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`orders read: ${error.message}`)
  if (!order) {
    console.log('SKIP order status: no hay pedidos')
    return
  }
  const original = String(order.status ?? 'pendiente')
  const probe = original === 'preparando' ? 'pendiente' : 'preparando'
  const { error: upErr } = await sb.from('orders').update({ status: probe }).eq('id', order.id)
  if (upErr) throw new Error(`orders update probe: ${upErr.message}`)
  const { error: revertErr } = await sb.from('orders').update({ status: original }).eq('id', order.id)
  if (revertErr) throw new Error(`orders revert: ${revertErr.message}`)
  console.log(`OK order status round-trip (${order.id.slice(0, 8)}… ${original} → ${probe} → ${original})`)
}

async function testProductDeleteDryRun() {
  const { data: row, error } = await sb
    .from('products')
    .select('id, name, stripe_product_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`products read: ${error.message}`)
  if (!row) {
    console.log('SKIP product delete dry-run: no hay productos')
    return
  }
  console.log(
    `OK product delete prerequisites (sample "${String(row.name).slice(0, 40)}", stripe=${row.stripe_product_id ? 'yes' : 'no'})`,
  )
}

async function main() {
  await testOrderStatusRoundTrip()
  await testProductDeleteDryRun()
  console.log('verify-admin-mutations: all checks passed')
}

main().catch((e) => {
  console.error('verify-admin-mutations FAILED:', e instanceof Error ? e.message : e)
  process.exit(1)
})
