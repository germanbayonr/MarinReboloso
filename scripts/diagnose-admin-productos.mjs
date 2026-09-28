/**
 * Replica el render de /admin/productos (fetch + mapProductRow + serialización RSC).
 * Uso: node --env-file=.env.local scripts/diagnose-admin-productos.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const SELECT =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,has_variants,variants,description,stripe_price_id,stripe_product_id'

function imageUrlFirstFromDatabase(raw) {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw.find((u) => typeof u === 'string' && u.trim())
    return first ? String(first).trim() : null
  }
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t || null
  }
  return null
}

function allImageUrlsFromDatabase(raw) {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
  }
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()]
  return []
}

function parseProductVariants(raw) {
  if (raw == null || typeof raw !== 'object') return { colors: [], sizes: [], items: [] }
  const o = raw
  const colors = Array.isArray(o.colors) ? o.colors.map((c) => String(c).trim()).filter(Boolean) : []
  const sizes = Array.isArray(o.sizes) ? o.sizes.map((s) => String(s).trim()).filter(Boolean) : []
  const items = Array.isArray(o.items)
    ? o.items
        .map((item, index) => {
          if (item == null || typeof item !== 'object') return null
          const row = item
          const extra = Array.isArray(row.image_urls)
            ? row.image_urls.map((u) => String(u ?? '').trim()).filter(Boolean)
            : []
          const primary = String(row.image_url ?? '').trim()
          const urls = [...new Set([...(primary ? [primary] : []), ...extra])]
          if (!urls.length) return null
          return {
            id: String(row.id ?? `var-${index}`),
            color: row.color != null ? String(row.color).trim() || null : null,
            size: row.size != null ? String(row.size).trim() || null : null,
            image_url: urls[0],
            in_stock: row.in_stock !== false,
            image_urls: urls.length > 1 ? urls : undefined,
          }
        })
        .filter(Boolean)
    : []
  return { colors, sizes, items }
}

function mapProductRow(p) {
  const hasVariants = p.has_variants === true
  const variants = parseProductVariants(p.variants)
  return {
    id: String(p.id),
    name: String(p.name ?? ''),
    price: Number(p.price) || 0,
    original_price: p.original_price != null ? Number(p.original_price) : null,
    discount_percent: Number(p.discount_percent) || 0,
    category: p.category ?? null,
    collection: p.collection ?? null,
    image_url: imageUrlFirstFromDatabase(p.image_url),
    image_urls: allImageUrlsFromDatabase(p.image_url),
    is_new_arrival: Boolean(p.is_new_arrival),
    in_stock: typeof p.in_stock === 'boolean' ? p.in_stock : true,
    is_active: typeof p.is_active === 'boolean' ? p.is_active : true,
    stripe_price_id: p.stripe_price_id ?? null,
    description: p.description ?? null,
    created_at: p.created_at != null ? String(p.created_at) : null,
    has_variants: hasVariants,
    variants: hasVariants ? variants : { colors: [], sizes: [], items: [] },
  }
}

const sb = createClient(url, key, { auth: { persistSession: false } })

const { data, error } = await sb
  .from('products')
  .select(SELECT)
  .order('created_at', { ascending: false, nullsFirst: false })
  .limit(5000)

if (error) {
  console.log(JSON.stringify({ ok: false, step: 'supabase.select', error: error.message }, null, 2))
  process.exit(1)
}

const rows = data ?? []
const mapped = []
const mapErrors = []

for (const row of rows) {
  try {
    mapped.push(mapProductRow(row))
  } catch (e) {
    mapErrors.push({
      id: row?.id,
      name: row?.name,
      message: e instanceof Error ? e.message : String(e),
    })
  }
}

let serializedBytes = 0
try {
  serializedBytes = Buffer.byteLength(JSON.stringify(mapped), 'utf8')
} catch (e) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        step: 'json.stringify',
        productCount: rows.length,
        message: e instanceof Error ? e.message : String(e),
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const VERCEL_RSC_WARN_BYTES = 4 * 1024 * 1024

console.log(
  JSON.stringify(
    {
      ok: mapErrors.length === 0,
      supabaseHost: new URL(url).hostname,
      productCount: rows.length,
      mappedCount: mapped.length,
      mapErrors: mapErrors.slice(0, 10),
      rscPayloadBytes: serializedBytes,
      rscPayloadMb: (serializedBytes / (1024 * 1024)).toFixed(2),
      likelyRscPayloadTooLarge: serializedBytes > VERCEL_RSC_WARN_BYTES,
      interpretation:
        mapErrors.length > 0
          ? 'Hay filas que rompen mapProductRow; esa es la causa del 500.'
          : serializedBytes > VERCEL_RSC_WARN_BYTES
            ? 'El catálogo serializado supera ~4MB; Next/Vercel puede responder 500 al pasar props al cliente.'
            : rows.length === 0
              ? 'No hay productos; el 500 tendría otra causa (código no desplegado, otro error en build).'
              : 'Fetch + map OK en local; si producción sigue en 500, el despliegue no incluye el último código o mira el digest en Vercel Logs.',
    },
    null,
    2,
  ),
)
