#!/usr/bin/env node
/**
 * Fusiona imágenes en Supabase sin eliminar las existentes.
 * Fuentes: generated-catalog.json + carpetas MAREBO WEB/Colecciones (todas las fotos por producto).
 *
 *   node --env-file=.env.local scripts/merge-product-images-from-sources.mjs
 *   node --env-file=.env.local scripts/merge-product-images-from-sources.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const apply = process.argv.includes('--apply')
const CDN = 'https://marebo.b-cdn.net/Colecciones'
const DISK_BASE = '/Users/Wincoaching1/Proyectos Desarrollador/MAREBO WEB/Colecciones'
const CATALOG_PATH = path.join(process.cwd(), 'lib/data/generated-catalog.json')

const FOLDER_TO_COLLECTION = [
  { folder: 'II DROP Jaipur', slug: 'jaipur', cdnFolder: 'II%20DROP%20Jaipur' },
  { folder: 'Drop _Descará_', slug: 'descara', cdnFolder: 'Drop%20_Descara%CC%81_' },
  { folder: 'Corales', slug: 'corales', cdnFolder: 'Corales' },
  { folder: 'Filipa', slug: 'filipa', cdnFolder: 'Filipa' },
  { folder: 'MAREBO', slug: 'marebo', cdnFolder: 'MAREBO' },
]

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function cleanDisplayName(filename) {
  let name = filename.replace(/\.[^/.]+$/, '')
  name = name.replace(/[-_ ]*(copia|copy|web|editada|final)/gi, '')
  name = name.replace(/\(\d+\)$/g, '').replace(/[-_ ]+\d+$/g, '').replace(/\.\.+$/g, '').trim()
  name = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').replace(/\.+$/, '').trim()
  return name
}

function isImage(file) {
  return /\.(png|jpg|jpeg|webp|gif|PNG|JPG|JPEG|WEBP)$/i.test(file)
}

function urlsFromRow(imageUrl) {
  if (imageUrl == null) return []
  if (typeof imageUrl === 'string') return imageUrl.trim() ? [imageUrl.trim()] : []
  if (Array.isArray(imageUrl)) return imageUrl.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
  return []
}

function mergeUrls(existing, incoming) {
  const out = [...existing]
  for (const url of incoming) {
    const t = String(url ?? '').trim()
    if (!t) continue
    if (!out.includes(t)) out.push(t)
  }
  return out
}

function loadDiskImagesByProductKey() {
  const map = new Map()
  for (const mapFolder of FOLDER_TO_COLLECTION) {
    const dir = path.join(DISK_BASE, mapFolder.folder)
    if (!fs.existsSync(dir)) continue
    const groups = new Map()
    for (const file of fs.readdirSync(dir).filter(isImage)) {
      const base = cleanDisplayName(file).toLowerCase()
      if (!base) continue
      if (!groups.has(base)) groups.set(base, [])
      groups.get(base).push(file)
    }
    for (const [base, files] of groups) {
      const urls = files.map(
        (file) => `${CDN}/${mapFolder.cdnFolder}/${encodeURIComponent(file)}`,
      )
      const key = `${mapFolder.slug}::${normalizeName(base)}`
      map.set(key, urls)
    }
  }
  return map
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ Faltan credenciales Supabase')
    process.exit(1)
  }

  const sb = createClient(url, key, { auth: { persistSession: false } })
  const { data: products, error } = await sb
    .from('products')
    .select('id,name,collection,image_url')
    .eq('is_active', true)
    .limit(10000)

  if (error) {
    console.error('❌', error.message)
    process.exit(1)
  }

  const catalog = fs.existsSync(CATALOG_PATH) ? JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) : []
  const catalogByName = new Map(catalog.map((item) => [normalizeName(item.name), item]))
  const diskByKey = loadDiskImagesByProductKey()

  const updates = []
  for (const row of products ?? []) {
    const existing = urlsFromRow(row.image_url)
    const nameKey = normalizeName(row.name)
    const col = String(row.collection ?? '').trim().toLowerCase()
    const diskKey = `${col}::${normalizeName(cleanDisplayName(row.name))}`
    const incoming = []

    const cat = catalogByName.get(nameKey)
    if (cat?.image_url) incoming.push(String(cat.image_url).trim())

    const diskUrls = diskByKey.get(diskKey) ?? []
    incoming.push(...diskUrls)

    const merged = mergeUrls(existing, incoming)
    if (merged.length === existing.length) continue
    updates.push({
      id: row.id,
      name: row.name,
      before: existing.length,
      after: merged.length,
      merged,
    })
  }

  console.log(`\n🔍 Productos con imágenes a fusionar: ${updates.length}`)
  for (const u of updates.slice(0, 15)) {
    console.log(`  + ${u.name}: ${u.before} → ${u.after} imágenes`)
  }
  if (updates.length > 15) console.log(`  … y ${updates.length - 15} más`)

  if (!apply) {
    console.log('\nDry-run. Usa --apply para escribir en Supabase (solo añade, nunca quita).')
    return
  }

  let ok = 0
  for (const u of updates) {
    const { error: upErr } = await sb.from('products').update({ image_url: u.merged }).eq('id', u.id)
    if (upErr) {
      console.error('❌', u.name, upErr.message)
      process.exit(1)
    }
    ok++
  }
  console.log(`\n✅ ${ok} producto(s) actualizados (imágenes fusionadas, ninguna eliminada).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
