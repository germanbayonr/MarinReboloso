#!/usr/bin/env node
/**
 * Genera lib/data/generated-catalog.json desde carpetas locales MAREBO WEB.
 * Ejecutar: node scripts/build-catalog-from-disk.js
 */
const fs = require('fs')
const path = require('path')
const { formatProductDisplayName } = require('../lib/format-product-name.js')

function normalizeCatalogKey(value) {
  return formatProductDisplayName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const BASE = '/Users/Wincoaching1/Proyectos Desarrollador/MAREBO WEB/Colecciones'
const CDN = 'https://marebo.b-cdn.net/Colecciones'
const OUT = path.join(process.cwd(), 'lib/data/generated-catalog.json')

const FOLDER_TO_COLLECTION = [
  { folder: 'II DROP Jaipur', slug: 'jaipur', cdnFolder: 'II%20DROP%20Jaipur' },
  { folder: 'Drop _Descará_', slug: 'descara', cdnFolder: 'Drop%20_Descara%CC%81_' },
  { folder: 'Corales', slug: 'corales', cdnFolder: 'Corales' },
  { folder: 'Filipa', slug: 'filipa', cdnFolder: 'Filipa' },
  { folder: 'MAREBO', slug: 'marebo', cdnFolder: 'MAREBO' },
]

function cleanDisplayName(filename) {
  let name = filename.replace(/\.[^/.]+$/, '')
  name = name.replace(/[-_ ]*(copia|copy|web|editada|final)/gi, '')
  name = name.replace(/\(\d+\)$/g, '').replace(/[-_ ]+\d+$/g, '').replace(/\.\.+$/g, '').trim()
  name = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').replace(/\.+$/, '').trim()
  return name
}

function detectCategory(filename) {
  const n = filename.toLowerCase()
  if (n.includes('manton')) return 'mantones'
  if (n.includes('collar') || n.includes('gargantilla')) return 'collares'
  if (n.includes('pulsera') || n.includes('brazalete')) return 'pulseras'
  if (n.includes('bolso') || n.includes('clutch')) return 'bolsos'
  if (n.includes('peinecillo')) return 'peinecillos'
  if (n.includes('broche')) return 'broches'
  return 'pendientes'
}

function isImage(file) {
  return /\.(png|jpg|jpeg|webp|gif|PNG|JPG|JPEG|WEBP)$/i.test(file)
}

function pickBestFile(files) {
  const scored = files.map((f) => {
    const lower = f.toLowerCase()
    let score = 0
    if (lower.endsWith('.webp')) score += 5
    if (lower.endsWith('.png')) score += 4
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) score += 3
    if (/\(\d+\)/.test(f)) score -= 2
    if (/_1_/.test(f)) score -= 1
    if (/\.\./.test(f)) score -= 1
    if (/ \d+\./.test(f)) score -= 2
    return { f, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.f
}

function main() {
  const items = []
  const seenNames = new Set()

  for (const map of FOLDER_TO_COLLECTION) {
    const dir = path.join(BASE, map.folder)
    if (!fs.existsSync(dir)) {
      console.warn('⚠ Carpeta no encontrada:', dir)
      continue
    }
    const files = fs.readdirSync(dir).filter(isImage)
    const groups = new Map()
    for (const file of files) {
      const base = cleanDisplayName(file).toLowerCase()
      if (!base) continue
      if (!groups.has(base)) groups.set(base, [])
      groups.get(base).push(file)
    }
    for (const groupFiles of groups.values()) {
      const file = pickBestFile(groupFiles)
      const name = formatProductDisplayName(cleanDisplayName(file))
      const key = `${map.slug}::${normalizeCatalogKey(name)}`
      if (seenNames.has(key)) continue
      seenNames.add(key)
      items.push({
        name,
        image_url: `${CDN}/${map.cdnFolder}/${encodeURIComponent(file)}`,
        collection: map.slug,
        category: detectCategory(file),
      })
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2))
  const byCol = items.reduce((acc, i) => {
    acc[i.collection] = (acc[i.collection] || 0) + 1
    return acc
  }, {})
  console.log('✅ Catálogo generado:', OUT)
  console.log('   Total:', items.length, byCol)
}

main()
