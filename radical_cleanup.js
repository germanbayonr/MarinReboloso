/**
 * Limpieza radical del catálogo Supabase con coincidencia flexible (NFD + mayúsculas + espacios).
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local (bypass RLS).
 *
 * Uso: node radical_cleanup.js
 * Simulación: DRY_RUN=1 node radical_cleanup.js
 */

const { createClient } = require('@supabase/supabase-js')
const { readFileSync, existsSync } = require('fs')
const { resolve } = require('path')

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) {
    console.error('No existe .env.local en la raíz del proyecto.')
    process.exit(1)
  }
  const src = readFileSync(p, 'utf8')
  for (const line of src.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const m = t.match(/^(?:export\s+)?([\w.]+)\s*=\s*(.*)$/)
    if (!m) continue
    const k = m[1]
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined) process.env[k] = v
  }
}

function normKey(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function firstWord(name) {
  return (String(name ?? '').trim().split(/\s+/)[0] || '')
}

function priceNum(p) {
  const n = typeof p.price === 'number' ? p.price : Number(p.price)
  return Number.isFinite(n) ? n : NaN
}

function isImageEmpty(image_url) {
  if (image_url == null) return true
  if (Array.isArray(image_url)) {
    return image_url.length === 0 || !String(image_url[0] ?? '').trim()
  }
  return !String(image_url).trim()
}

function imageUrlsFromRow(row) {
  const u = row.image_url
  if (Array.isArray(u)) return u.filter(Boolean).map(String)
  if (typeof u === 'string' && u.trim()) return [u.trim()]
  return []
}

async function fetchAllProducts(supabase) {
  const pageSize = 1000
  const out = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw new Error(error.message)
    const batch = data ?? []
    out.push(...batch)
    if (batch.length < pageSize) break
    offset += pageSize
    if (offset > 50000) break
  }
  return out
}

function collectDeleteIds(rows) {
  const ids = new Set()
  const log = []

  const add = (row, reason) => {
    if (!row?.id) return
    if (ids.has(row.id)) return
    ids.add(row.id)
    log.push({ id: row.id, name: row.name, price: row.price, reason })
  }

  for (const row of rows) {
    const nk = normKey(row.name)
    const p = priceNum(row)
    const compact = String(row.name ?? '').replace(/\s+/g, ' ').trim()

    if (nk === normKey('Collar Coralia')) add(row, 'DELETE: Collar Coralia')

    if (nk === normKey('Manton Agua de Mujer') && p === 25) add(row, 'DELETE: Manton Agua de Mujer price 25')

    // Solo variante con "Manton" ASCII (no borrar "Mantón Agua de Niña")
    if (/^Manton$/i.test(firstWord(row.name)) && nk === normKey('Manton Agua de Niña')) {
      add(row, 'DELETE: Manton Agua de Niña (ASCII Manton)')
    }

    if (nk === normKey('Mantón Carmesí Edición Limitada')) add(row, 'DELETE: Mantón Carmesí Edición Limitada')

    if (/^Manton$/i.test(firstWord(row.name)) && nk === normKey('Manton Dolores')) {
      add(row, 'DELETE: Manton Dolores (ASCII Manton)')
    }

    if (nk === normKey('Manton Lima') && p === 25) add(row, 'DELETE: Manton Lima price 25')

    if (nk === normKey('Mantón Isabella Edición Limitada')) add(row, 'DELETE: Mantón Isabella Edición Limitada')

    if (nk === normKey('Manton de Mujer Candela') && p === 25) add(row, 'DELETE: Manton de Mujer Candela price 25')

    if (nk === normKey('Mantón Noir') || nk === normKey('Mantón Noir de Mujer')) {
      add(row, 'DELETE: Mantón Noir variants')
    }

    if (nk === normKey('Mantón Oliva')) add(row, 'DELETE: Mantón Oliva')

    if (/^Manton$/i.test(firstWord(row.name)) && nk === normKey('Manton Rosa de Triana')) {
      add(row, 'DELETE: Manton Rosa de Triana (ASCII Manton)')
    }

    if (/^Manton$/i.test(firstWord(row.name)) && nk === normKey('Manton Valentina') && p === 25) {
      add(row, 'DELETE: Manton Valentina price 25')
    }
    if (/^Manton$/i.test(firstWord(row.name)) && nk === normKey('Manton Valeria') && p === 25) {
      add(row, 'DELETE: Manton Valeria price 25')
    }

    if (nk === normKey('Peinecillos Noir Filigrana') && isImageEmpty(row.image_url)) {
      add(row, 'DELETE: Peinecillos Noir Filigrana sin imagen')
    }

    if (nk === normKey('Peinecillos Rosa Nude')) add(row, 'DELETE: Peinecillos Rosa Nude')

    if (nk === normKey('Pendiente Aura Noir')) add(row, 'DELETE: Pendiente Aura Noir')

    if (nk === normKey('Pendientes Aura Coralina Coral Antiguo') && p === 30) {
      add(row, 'DELETE: Pendientes Aura Coralina Coral Antiguo price 30')
    }

    if (nk === normKey('Pendientes Coralia')) add(row, 'DELETE: Pendientes Coralia')

    if (nk === normKey('Pendientes Folklore Negras')) add(row, 'DELETE: Pendientes Folklore Negras')

    if (/^Pendientes\s+Lagrimas\s+de\s+Coral$/i.test(compact) && !/Lágrimas/i.test(row.name)) {
      add(row, 'DELETE: Pendientes Lagrimas de Coral (sin tilde)')
    }

    if (nk === normKey('Pendientes Linaje Carmesí') && p === 25) add(row, 'DELETE: Pendientes Linaje Carmesí price 25')

    if (/^Pendientes\s+Solea\s+Naranjas$/i.test(compact)) add(row, 'DELETE: Pendientes Solea Naranjas')

    if (
      (nk === normKey('Pendientes Soleá Negros') || nk === normKey('Pendientes Solea Negros')) &&
      p === 20
    ) {
      add(row, 'DELETE: Pendientes Soleá/Solea Negros price 20')
    }

    if (
      (nk === normKey('Pendientes Soleá Rojos') || nk === normKey('Pendientes Solea Rojos')) &&
      p === 20
    ) {
      add(row, 'DELETE: Pendientes Soleá/Solea Rojos price 20')
    }

    if (nk === normKey('Pendientesdescara Esmeralda') && p === 25) {
      add(row, 'DELETE: Pendientesdescara Esmeralda price 25')
    }

    if (nk === normKey('Pendientesdescara Cordoba')) add(row, 'DELETE: Pendientesdescara Cordoba')
    if (nk === normKey('Pendientesdescara Pasion')) add(row, 'DELETE: Pendientesdescara Pasion')

    if (
      nk === normKey('Pnedinetesfolklore Blancos') ||
      nk === normKey('Pnedinetesfolklore Fucsia') ||
      nk === normKey('Pnedinetesfolklore Negros') ||
      nk === normKey('Pnedinetesfolklore Turquesas')
    ) {
      add(row, 'DELETE: Pnedinetesfolklore typo')
    }

    if (nk === normKey('Piquillo Lima')) add(row, 'DELETE: Piquillo Lima')

    if (nk === normKey('Pulseras Folklore Turquesa') && p === 25) {
      add(row, 'DELETE: Pulseras Folklore Turquesa price 25')
    }
  }

  return { ids: [...ids], log }
}

function findRows(rows, targetName) {
  const nk = normKey(targetName)
  return rows.filter((r) => normKey(r.name) === nk)
}

function findOne(rows, targetName) {
  const m = findRows(rows, targetName)
  return m[0] ?? null
}

function scoreKeepRow(a, b) {
  const sa =
    (a.stripe_product_id ? 4 : 0) +
    (a.stripe_price_id ? 2 : 0) +
    (!isImageEmpty(a.image_url) ? 1 : 0)
  const sb =
    (b.stripe_product_id ? 4 : 0) +
    (b.stripe_price_id ? 2 : 0) +
    (!isImageEmpty(b.image_url) ? 1 : 0)
  if (sa !== sb) return sa > sb ? a : b
  return String(a.id).localeCompare(String(b.id)) <= 0 ? a : b
}

async function deleteByIds(supabase, ids) {
  const chunk = 80
  const unique = [...new Set(ids)]
  for (let i = 0; i < unique.length; i += chunk) {
    const slice = unique.slice(i, i + chunk)
    const { error } = await supabase.from('products').delete().in('id', slice)
    if (error) throw new Error(`delete batch: ${error.message}`)
  }
}

async function updateRow(supabase, id, patch) {
  const { error } = await supabase.from('products').update(patch).eq('id', id)
  if (error) throw new Error(`update ${id}: ${error.message}`)
}

async function setImageUrl(supabase, id, urls) {
  let { error } = await supabase.from('products').update({ image_url: urls }).eq('id', id)
  if (error) {
    const { error: e2 } = await supabase.from('products').update({ image_url: urls[0] ?? null }).eq('id', id)
    if (e2) throw new Error(`image_url ${id}: ${e2.message}`)
    console.warn(`  [WARN] image_url como array falló para ${id}; guardada solo primera URL.`)
  }
}

/** Filas que violan invariantes de negocio (deben desaparecer). */
function collectForbiddenRows(products) {
  const problems = []
  const push = (row, msg) => problems.push({ row, msg })

  for (const row of products) {
    const nk = normKey(row.name)
    const p = priceNum(row)

    if (nk === normKey('Manton Agua de Mujer') && p === 25) {
      push(row, 'FORBIDDEN: Manton Agua de Mujer @25')
    }
    if (/^Manton$/i.test(firstWord(row.name)) && nk === normKey('Manton Dolores')) {
      push(row, 'FORBIDDEN: Manton Dolores (ASCII)')
    }
    if (nk === normKey('Manton Lima') && p === 25) push(row, 'FORBIDDEN: Manton Lima @25')
    if (nk === normKey('Manton de Mujer Candela') && p === 25) {
      push(row, 'FORBIDDEN: Manton de Mujer Candela @25')
    }
    if (/^Manton$/i.test(firstWord(row.name)) && nk === normKey('Manton Valentina') && p === 25) {
      push(row, 'FORBIDDEN: Manton Valentina @25')
    }
    if (/^Manton$/i.test(firstWord(row.name)) && nk === normKey('Manton Valeria') && p === 25) {
      push(row, 'FORBIDDEN: Manton Valeria @25')
    }
    if (nk === normKey('Pendientes Linaje Carmesí') && p === 25) {
      push(row, 'FORBIDDEN: Pendientes Linaje Carmesí @25')
    }
    if (nk === normKey('Pendientesdescara Esmeralda') && p === 25) {
      push(row, 'FORBIDDEN: Pendientesdescara Esmeralda @25')
    }
    if (nk === normKey('Pulseras Folklore Turquesa') && p === 25) {
      push(row, 'FORBIDDEN: Pulseras Folklore Turquesa @25')
    }
  }
  return problems
}

function collectDuplicateGroups(products) {
  const byKey = new Map()
  for (const row of products) {
    const k = normKey(row.name)
    if (!k) continue
    if (!byKey.has(k)) byKey.set(k, [])
    byKey.get(k).push(row)
  }
  return [...byKey.entries()].filter(([, list]) => list.length > 1)
}

async function main() {
  loadEnvLocal()
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !key) {
    console.error('Falta SUPABASE_SERVICE_ROLE_KEY o URL en .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  console.log(DRY_RUN ? '\n*** DRY_RUN=1 (sin escrituras) ***\n' : '\n*** RADICAL CLEANUP (escrituras activas) ***\n')

  let rows = await fetchAllProducts(supabase)
  console.log(`Productos cargados: ${rows.length}`)

  const { ids: deleteIds, log: deleteLog } = collectDeleteIds(rows)
  console.log(`\n[PARTE 1] Filas marcadas para DELETE: ${deleteIds.length}`)
  deleteLog.slice(0, 40).forEach((l) => console.log(`  - ${l.reason} | ${l.name}`))
  if (deleteLog.length > 40) console.log(`  ... +${deleteLog.length - 40} más`)

  if (!DRY_RUN && deleteIds.length) {
    await deleteByIds(supabase, deleteIds)
    rows = await fetchAllProducts(supabase)
    console.log(`Tras borrado: ${rows.length} productos`)
  }

  console.log('\n[PARTE 2] Renombres / Stripe price id')

  const part2 = [
    {
      find: 'Pendientes Aura Coralinacoral Antiguo',
      patch: { name: 'Pendientes Aura Coralina Coral Antiguo', price: 25 },
    },
    {
      find: 'Pendientes Coralia Bottel Green',
      patch: { name: 'Pendientes Coralia Bottle Green' },
    },
    {
      find: 'Pendientes Descará Coral',
      patch: { name: 'Pendientes Descará Córdoba Rojos' },
    },
    {
      find: 'Pendientes Lagrimas de Coralinas',
      patch: { name: 'Pendientes Lágrimas de Coral Negros' },
    },
    {
      find: 'Pendientes Solea Negros',
      filter: (r) => priceNum(r) === 25,
      patch: { name: 'Pendientes Soleá Negros' },
    },
    {
      find: 'Pendientes Solea Rojos',
      filter: (r) => priceNum(r) === 25,
      patch: { name: 'Pendientes Soleá Rojos' },
    },
    {
      find: 'Pendientes Folklore Turquesa',
      patch: { stripe_price_id: 'price_1T8kl3DOtBdEHYqKAw0QQ0vV' },
    },
  ]

  for (const op of part2) {
    const candidates = findRows(rows, op.find).filter(op.filter ?? (() => true))
    if (candidates.length === 0) {
      console.log(`  (skip) No encontrado: ${op.find}`)
      continue
    }
    if (candidates.length > 1) {
      console.log(`  [WARN] Múltiples coincidencias (${candidates.length}) para ${op.find}; actualizando todas.`)
    }
    for (const r of candidates) {
      if (!DRY_RUN) await updateRow(supabase, r.id, op.patch)
      console.log(`  OK update id=${r.id} <- ${op.find}`)
    }
  }

  if (!DRY_RUN) rows = await fetchAllProducts(supabase)

  console.log('\n[PARTE 3] Inyección image_url (array; fallback 1ª URL si falla el tipo)')

  const mujerCandelaValid = rows.find(
    (r) => normKey(r.name) === normKey('Mantón de Mujer Candela') && priceNum(r) !== 25,
  )
  const srcUrlsMujer = mujerCandelaValid ? imageUrlsFromRow(mujerCandelaValid) : []
  const copyMujerUrl = srcUrlsMujer[0] ?? null

  if (copyMujerUrl) {
    const t = findOne(rows, 'Mantón de Niña Candela')
    if (!t) console.log('  (skip) Mantón de Niña Candela no encontrado')
    else {
      if (!DRY_RUN) await setImageUrl(supabase, t.id, [copyMujerUrl])
      console.log('  OK image Mantón de Niña Candela')
    }
  } else {
    console.log('  (skip) No hay Mantón de Mujer Candela válido (precio ≠ 25) con imagen')
  }

  const staticImages = [
    {
      name: 'Mantón Rosa de Triana',
      urls: ['https://marebo.b-cdn.net/PRODUCTOS/Mantones/Manton%20_Rosa%20de%20Triana_.PNG'],
    },
    {
      name: 'Pendientes Coralia Bottle Green',
      urls: [
        'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Bottle%20Green.jpg',
        'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Bottel%20Green.png',
      ],
    },
    {
      name: 'Pendientes Coralia Cocoa',
      urls: ['https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Cocoa.png'],
    },
    {
      name: 'Pendientes Coralia Electric Blue',
      urls: ['https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Electric%20Blue.PNG'],
    },
    {
      name: 'Pendientes Coralia Ivory',
      urls: ['https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Ivory.PNG'],
    },
    {
      name: 'Pendientes Coralia Pistacho',
      urls: [
        'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Pistachio(1).png',
        'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Pistachio.png',
      ],
    },
    {
      name: 'Pendientes Coralia Salmón',
      urls: ['https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Salmon.PNG'],
    },
    {
      name: 'Pendientes Descará Córdoba',
      urls: [
        'https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Cordoba%20Coral.PNG',
        'https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Coral%202.jpg',
      ],
    },
    {
      name: 'Pendientes Descará Córdoba Coral',
      urls: ['https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Coral.PNG'],
    },
    {
      name: 'Pendientes Descará Córdoba Rojos',
      urls: ['https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/PendientesDescara%20Cordoba.PNG'],
    },
    {
      name: 'Pendientes Folklore Fucsia',
      urls: ['https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientesfolklore%20fucsia.PNG'],
    },
    {
      name: 'Pendientes Lágrimas de Coral',
      urls: ['https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20_Lagrimas%20de%20coral_%20.png'],
    },
    {
      name: 'Pendientes Lágrimas de Coral Negros',
      urls: ['https://marebo.b-cdn.net/Colecciones/Corales/pendientes%20lagrimas%20de%20coral.PNG'],
    },
  ]

  for (const si of staticImages) {
    const t = findOne(rows, si.name)
    if (!t) {
      console.log(`  (skip) No encontrado: ${si.name}`)
      continue
    }
    if (!DRY_RUN) await setImageUrl(supabase, t.id, si.urls)
    console.log(`  OK images: ${si.name}`)
  }

  const triUrls = [
    'https://marebo.b-cdn.net/Colecciones/MAREBO/Pendiente%20Triangulo%20Rubi.png',
    'https://marebo.b-cdn.net/Colecciones/MAREBO/Pendientes%20Tria%CC%81ngulo%20Rubi%CC%81(1).JPG',
  ]
  const triMatches = rows.filter((r) => normKey(r.name).startsWith('pendientes triangulo rubi'))
  if (!triMatches.length) console.log('  (skip) Ningún Pendientes Triangulo Rubi…')
  else {
    for (const t of triMatches) {
      if (!DRY_RUN) await setImageUrl(supabase, t.id, triUrls)
      console.log(`  OK images: ${t.name} (${t.id})`)
    }
  }

  if (!DRY_RUN) rows = await fetchAllProducts(supabase)

  console.log('\n' + '='.repeat(72))
  console.log('  ACCIONES MANUALES REQUERIDAS')
  console.log('='.repeat(72))
  console.log(
    '\n  >>> REVISAR MANUALMENTE EN STRIPE: Actualizar los precios según los documentos adjuntos de la clienta.\n',
  )
  console.log(
    '  >>> ACCIÓN MANUAL EN SUPABASE: Asignar precio correcto a "Peinecillo Noir Filigrana".\n',
  )
  console.log(
    '  >>> ACCIÓN MANUAL EN SUPABASE: Añadir las URLs de imágenes para "Pendientes Aura Noir" (no proporcionadas en el prompt).\n',
  )
  console.log('='.repeat(72))

  console.log('\n[PARTE 5] Auto-verificación')

  let products = DRY_RUN ? rows : await fetchAllProducts(supabase)
  const maxPasses = 10

  for (let iteration = 0; iteration < maxPasses; iteration++) {
    const forbidden = collectForbiddenRows(products)
    const dupGroups = collectDuplicateGroups(products)

    console.log(
      `  Iteración ${iteration + 1}: filas prohibidas=${forbidden.length}, grupos duplicados=${dupGroups.length}`,
    )

    if (!forbidden.length && !dupGroups.length) {
      console.log('\n  *** AUTO-VERIFICACIÓN: 100% LIMPIA ***\n')
      console.log(`  Total productos: ${products.length}`)
      break
    }

    if (DRY_RUN) {
      console.log('\n  DRY_RUN: no se corrigen duplicados ni prohibidos.')
      forbidden.slice(0, 20).forEach((b) => console.log(`    - ${b.msg}: ${b.row.name} (${b.row.id})`))
      dupGroups.slice(0, 10).forEach(([k, list]) => console.log(`    DUP [${k}] x${list.length}`))
      return
    }

    const toDelete = new Set()

    for (const { row } of forbidden) {
      toDelete.add(row.id)
    }

    for (const [, list] of dupGroups) {
      let keeper = list[0]
      for (let i = 1; i < list.length; i++) keeper = scoreKeepRow(keeper, list[i])
      for (const r of list) {
        if (r.id !== keeper.id) toDelete.add(r.id)
      }
    }

    if (toDelete.size === 0) {
      console.error('\n  *** ATASCADO: hay problemas pero no se generaron IDs para borrar ***')
      forbidden.slice(0, 15).forEach((b) => console.error(`    - ${b.msg}: ${b.row.name}`))
      dupGroups.slice(0, 5).forEach(([k, list]) => console.error(`    DUP [${k}]`, list.map((r) => r.id)))
      process.exitCode = 1
      return
    }

    console.log(`  Eliminando ${toDelete.size} filas (prohibidas + duplicados)…`)
    await deleteByIds(supabase, [...toDelete])
    products = await fetchAllProducts(supabase)
  }

  const finalForbidden = collectForbiddenRows(products)
  const finalDups = collectDuplicateGroups(products)
  if (finalForbidden.length || finalDups.length) {
    console.error('\n  *** AUTO-VERIFICACIÓN: SIGUEN HABIENDO PROBLEMAS (máx. iteraciones) ***')
    finalForbidden.slice(0, 25).forEach((b) => console.error(`    - ${b.msg}: ${b.row.name} (${b.row.id})`))
    finalDups.slice(0, 15).forEach(([k, list]) =>
      console.error(`    DUP [${k}] -> ${list.map((r) => r.id).join(', ')}`),
    )
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
