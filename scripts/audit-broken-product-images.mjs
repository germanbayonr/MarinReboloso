/**
 * Lista imágenes de productos en Supabase Storage que el navegador no puede decodificar.
 * Uso: node --env-file=.env.local scripts/audit-broken-product-images.mjs
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, key)

function urlsFromRow(row) {
  const raw = row.image_url
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()]
  return []
}

async function isDecodableImage(imageUrl) {
  const res = await fetch(imageUrl)
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
  const buf = Buffer.from(await res.arrayBuffer())
  try {
    const meta = await sharp(buf).metadata()
    if (!meta.width || !meta.height) return { ok: false, reason: 'sin dimensiones' }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'formato no decodificable' }
  }
}

const { data: products, error } = await sb
  .from('products')
  .select('id,name,image_url')
  .order('created_at', { ascending: false })
  .limit(5000)

if (error) {
  console.error(error.message)
  process.exit(1)
}

const broken = []
for (const row of products ?? []) {
  for (const imageUrl of urlsFromRow(row)) {
    if (!String(imageUrl).includes('.supabase.co/storage/')) continue
    const check = await isDecodableImage(imageUrl)
    if (!check.ok) {
      broken.push({ id: row.id, name: row.name, url: imageUrl, reason: check.reason })
    }
  }
}

console.log(JSON.stringify({ brokenCount: broken.length, broken }, null, 2))
