import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { runCreateProduct } from '@/lib/admin/create-product-server'
import { uploadOptimizedAdminImages } from '@/lib/admin/upload-optimized-admin-images'

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
  const i = trimmed.indexOf('=')
  const key = trimmed.slice(0, i).trim()
  const value = trimmed.slice(i + 1).trim().replace(/^"|"$/g, '')
  if (!process.env[key]) process.env[key] = value
}

async function main() {
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
if (!url || !key) {
  console.error('FAIL missing supabase env')
  process.exit(1)
}

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
  'base64',
)

const slug = `zz-upload-${Date.now().toString(36)}`
const sb = createClient(url, key, { auth: { persistSession: false } })

const collection = await sb
  .from('collections')
  .insert({
    slug,
    label: 'ZZ Upload Test',
    is_active: true,
    sort_order: 900,
    homepage_order: 900,
    visible_on_homepage: false,
    visible_on_site: true,
  })
  .select('id,slug')
  .single()

if (collection.error || !collection.data) {
  console.error('FAIL collection', collection.error?.message)
  process.exit(1)
}

const file = new File([new Uint8Array(png)], 'pendiente-test.png', { type: 'image/png' })
const uploaded = await uploadOptimizedAdminImages(sb, [file], 'products')
if (!uploaded.ok) {
  await sb.from('collections').delete().eq('id', collection.data.id)
  console.error('FAIL upload', uploaded.error)
  process.exit(1)
}

const imageRes = await fetch(uploaded.urls[0], { cache: 'no-store' })
if (!imageRes.ok) {
  console.error('FAIL image http', imageRes.status, uploaded.urls[0])
  process.exit(1)
}

const created = await runCreateProduct(sb, {
  name: `ZZ producto ${slug}`,
  description: 'prueba de alta',
  category: 'pendientes',
  collection: slug,
  image_url: uploaded.urls[0],
  image_urls: uploaded.urls,
  is_new_arrival: false,
  in_stock: true,
  original_price: 42,
  discount_percent: 0,
  has_variants: false,
})

if (!created.ok) {
  console.error('FAIL create', created.error)
  process.exit(1)
}

const row = await sb
  .from('products')
  .select('id,name,price,collection,image_url,is_active,stripe_price_id')
  .eq('id', created.id)
  .single()

const imageUrl = Array.isArray(row.data?.image_url) ? row.data.image_url[0] : row.data?.image_url
const ok =
  row.data?.collection === slug &&
  Number(row.data?.price) === 42 &&
  String(imageUrl) === uploaded.urls[0] &&
  row.data?.is_active === true

console.log(
  JSON.stringify({
    ok,
    id: created.id,
    collection: row.data?.collection,
    price: row.data?.price,
    image: imageUrl,
    stripe: row.data?.stripe_price_id ? 'linked' : 'missing',
    stripeWarning: created.stripeWarning,
    readError: row.error?.message ?? null,
  }),
)

await sb.from('products').delete().eq('id', created.id)
const path = uploaded.urls[0].split('/product-images/')[1]
if (path) await sb.storage.from('product-images').remove([decodeURIComponent(path)])
await sb.from('collections').delete().eq('id', collection.data.id)

if (!ok) process.exit(1)
console.log('CLEANED')
}

main().catch((error) => {
  console.error('FAIL', error)
  process.exit(1)
})
