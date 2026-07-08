/**
 * Audita portadas de colección en Supabase Storage y opcionalmente limpia URLs rotas.
 * Uso: node --env-file=.env.local scripts/audit-broken-collection-images.mjs
 * Fix: node --env-file=.env.local scripts/audit-broken-collection-images.mjs --fix
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const shouldFix = process.argv.includes('--fix')

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, key)
const PUBLIC_PREFIX = '/storage/v1/object/public/'

function storagePathFromPublicUrl(imageUrl) {
  try {
    const parsed = new URL(imageUrl)
    const idx = parsed.pathname.indexOf(PUBLIC_PREFIX)
    if (idx === -1) return null
    const after = parsed.pathname.slice(idx + PUBLIC_PREFIX.length)
    const slash = after.indexOf('/')
    if (slash === -1) return null
    const bucket = decodeURIComponent(after.slice(0, slash))
    const path = decodeURIComponent(after.slice(slash + 1))
    if (!bucket || !path) return null
    return { bucket, path }
  } catch {
    return null
  }
}

async function isDecodable(imageUrl) {
  const res = await fetch(imageUrl, { cache: 'no-store' })
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
  const buf = Buffer.from(new Uint8Array(await res.arrayBuffer()))
  try {
    const meta = await sharp(buf, { failOn: 'error' }).metadata()
    if (!meta.width || !meta.height) return { ok: false, reason: 'sin dimensiones' }
    return { ok: true, bytes: buf.length }
  } catch {
    return { ok: false, reason: 'no decodificable' }
  }
}

const { data: collections, error } = await sb
  .from('collections')
  .select('slug,hero_image_left,hero_image_right')
  .order('homepage_order')

if (error) {
  console.error(error.message)
  process.exit(1)
}

const broken = []

for (const row of collections ?? []) {
  for (const [field, value] of [
    ['hero_image_left', row.hero_image_left],
    ['hero_image_right', row.hero_image_right],
  ]) {
    const imageUrl = String(value ?? '').trim()
    if (!imageUrl.includes('.supabase.co/storage/')) continue
    const check = await isDecodable(imageUrl)
    if (!check.ok) {
      broken.push({
        slug: row.slug,
        field,
        url: imageUrl,
        reason: check.reason,
      })
    }
  }
}

console.log(JSON.stringify({ brokenCount: broken.length, broken }, null, 2))

if (!shouldFix || broken.length === 0) process.exit(0)

const bySlug = new Map()
for (const item of broken) {
  if (!bySlug.has(item.slug)) bySlug.set(item.slug, { left: null, right: null, urls: [] })
  const entry = bySlug.get(item.slug)
  entry.urls.push(item.url)
  if (item.field === 'hero_image_left') entry.left = null
  if (item.field === 'hero_image_right') entry.right = null
}

for (const [slug, entry] of bySlug) {
  const { data: current } = await sb
    .from('collections')
    .select('hero_image_left,hero_image_right')
    .eq('slug', slug)
    .maybeSingle()

  const patch = {}
  if (entry.urls.includes(String(current?.hero_image_left ?? '').trim())) patch.hero_image_left = null
  if (entry.urls.includes(String(current?.hero_image_right ?? '').trim())) patch.hero_image_right = null
  if (Object.keys(patch).length === 0) continue

  const { error: updateError } = await sb.from('collections').update(patch).eq('slug', slug)
  if (updateError) {
    console.error('update failed', slug, updateError.message)
    continue
  }
  console.log('cleared', slug, patch)
}

const pathsByBucket = new Map()
for (const item of broken) {
  const parsed = storagePathFromPublicUrl(item.url)
  if (!parsed) continue
  if (!pathsByBucket.has(parsed.bucket)) pathsByBucket.set(parsed.bucket, new Set())
  pathsByBucket.get(parsed.bucket).add(parsed.path)
}

for (const [bucket, paths] of pathsByBucket) {
  const list = [...paths]
  const { error: removeError } = await sb.storage.from(bucket).remove(list)
  if (removeError) console.error('remove failed', bucket, removeError.message)
  else console.log('removed from storage', bucket, list.length)
}
