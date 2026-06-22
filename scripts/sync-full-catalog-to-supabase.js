#!/usr/bin/env node
/**
 * Volcado del catálogo generado (lib/data/generated-catalog.json) a Supabase.
 * Actualiza collection/category por nombre. NO sobrescribe imagen ni precio ya definidos en el panel admin.
 *
 * Uso:
 *   node scripts/sync-full-catalog-to-supabase.js          # dry-run
 *   node scripts/sync-full-catalog-to-supabase.js --apply    # escribe en BD
 */
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEFAULT_PRICE = 25
const CATALOG_PATH = path.join(process.cwd(), 'lib/data/generated-catalog.json')

function loadEnv() {
  const filePath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(filePath)) return
  fs.readFileSync(filePath, 'utf-8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/)
      if (!match) return
      let value = match[2] || ''
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[match[1]] = value
    })
}

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function sqlEscape(value) {
  return String(value).replace(/'/g, "''")
}

async function main() {
  loadEnv()
  const apply = process.argv.includes('--apply')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error('❌ Ejecuta antes: node scripts/build-catalog-from-disk.js')
    process.exit(1)
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'))
  const sb = createClient(url, key, { auth: { persistSession: false } })

  const { data: existing, error: fetchErr } = await sb
    .from('products')
    .select('id,name,collection,image_url,category,is_active,price,original_price')
    .limit(10000)

  if (fetchErr) {
    console.error('❌ Supabase:', fetchErr.message)
    process.exit(1)
  }

  const byName = new Map()
  for (const row of existing ?? []) {
    byName.set(normalizeName(row.name), row)
  }

  const toUpdate = []
  const toInsert = []

  function imageUrlsFromRow(imageUrl) {
    if (imageUrl == null) return []
    if (typeof imageUrl === 'string') return imageUrl.trim() ? [imageUrl.trim()] : []
    if (Array.isArray(imageUrl)) return imageUrl.filter((u) => typeof u === 'string' && u.trim())
    return []
  }

  for (const item of catalog) {
    const key = normalizeName(item.name)
    const found = byName.get(key)
    if (found) {
      const hasAdminImage = imageUrlsFromRow(found.image_url).length > 0
      const hasAdminPrice = found.price != null && Number(found.price) > 0
      const patch = {
        name: item.name.trim(),
        collection: item.collection,
        category: item.category,
        is_active: true,
        in_stock: true,
      }
      if (!hasAdminImage) patch.image_url = [item.image_url.trim()]
      if (!hasAdminPrice) {
        patch.price = DEFAULT_PRICE
        patch.original_price = DEFAULT_PRICE
        patch.discount_percent = 0
      }
      toUpdate.push({ id: found.id, ...patch })
      continue
    }
    toInsert.push({
      name: item.name.trim(),
      collection: item.collection,
      category: item.category,
      image_url: [item.image_url.trim()],
      is_active: true,
      in_stock: true,
      price: DEFAULT_PRICE,
      original_price: DEFAULT_PRICE,
      discount_percent: 0,
    })
  }

  const byCol = catalog.reduce((acc, i) => {
    acc[i.collection] = (acc[i.collection] || 0) + 1
    return acc
  }, {})

  console.log(`📦 Catálogo: ${catalog.length} piezas`, byCol)
  console.log(`🔄 Actualizar: ${toUpdate.length} | Insertar: ${toInsert.length}`)

  if (!apply) {
    console.log('\nDry-run. Usa --apply para escribir en Supabase.')
    return
  }

  let updated = 0
  for (const row of toUpdate) {
    const { id, ...patch } = row
    const { error } = await sb.from('products').update(patch).eq('id', id)
    if (error) {
      console.error('❌ Update fallido:', row.name, error.message)
      process.exit(1)
    }
    updated++
  }

  let inserted = 0
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50)
    const { error } = await sb.from('products').insert(batch)
    if (error) {
      console.error('❌ Insert fallido:', error.message)
      process.exit(1)
    }
    inserted += batch.length
  }

  console.log(`✅ Listo: ${updated} actualizados, ${inserted} insertados.`)

  const sqlLines = [
    '-- Volcado manual de colecciones (generado automáticamente)',
    `-- Total: ${catalog.length} productos`,
  ]
  for (const item of catalog) {
    const hasImage = `ARRAY['${sqlEscape(item.image_url)}']::text[]`
    sqlLines.push(
      `-- Solo rellena imagen/precio si el panel no los ha definido`,
      `UPDATE public.products SET collection = '${sqlEscape(item.collection)}', category = '${sqlEscape(item.category)}', image_url = CASE WHEN image_url IS NULL OR cardinality(image_url) = 0 THEN ${hasImage} ELSE image_url END, is_active = true, in_stock = true, price = COALESCE(NULLIF(price, 0), ${DEFAULT_PRICE}), original_price = COALESCE(NULLIF(original_price, 0), ${DEFAULT_PRICE}) WHERE lower(trim(name)) = lower(trim('${sqlEscape(item.name)}'));`,
    )
  }
  fs.writeFileSync(path.join(process.cwd(), 'scripts/seed-collection-products.sql'), sqlLines.join('\n'))
  console.log('📄 SQL guardado en scripts/seed-collection-products.sql')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
