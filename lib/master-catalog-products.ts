import generatedCatalog from '@/lib/data/generated-catalog.json'
import { masterCatalog } from '@/lib/data/master-catalog'
import { slugifyCollectionLabel } from '@/lib/collection-slug'
import { formatProductDisplayName } from '@/lib/format-product-name'
import type { AdminProduct } from '@/lib/admin/types'
import { emptyProductVariants } from '@/lib/product-variants'

const FALLBACK_PRICE = 25

type CatalogRow = { name: string; image_url: string; collection: string | null; category: string | null }

function sanitizeMasterUrl(raw: unknown): string {
  return String(raw ?? '').replace(/`/g, '').trim()
}

function masterCatalogId(name: string): string {
  return `mc-${slugifyCollectionLabel(formatProductDisplayName(name))}`
}

function normalizeCatalogKey(value: string): string {
  return formatProductDisplayName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function catalogRowKey(row: CatalogRow): string {
  const collection = String(row.collection ?? '').trim().toLowerCase()
  return `${collection}::${normalizeCatalogKey(row.name)}`
}

function dedupeMasterProducts(products: AdminProduct[]): AdminProduct[] {
  const merged = new Map<string, AdminProduct>()

  for (const product of products) {
    const key = `${product.collection ?? ''}::${normalizeCatalogKey(product.name)}`
    const existing = merged.get(key)

    if (!existing) {
      merged.set(key, product)
      continue
    }

    const urls = [
      ...new Set(
        [...(existing.image_urls ?? []), ...(product.image_urls ?? []), existing.image_url, product.image_url]
          .map((u) => String(u ?? '').trim())
          .filter(Boolean),
      ),
    ]

    merged.set(key, {
      ...existing,
      image_urls: urls,
      image_url: urls[0] ?? existing.image_url,
    })
  }

  return Array.from(merged.values())
}

function mapMasterRow(row: CatalogRow, index: number): AdminProduct {
  const displayName = formatProductDisplayName(String(row.name).trim())
  const url = sanitizeMasterUrl(row.image_url)
  return {
    id: masterCatalogId(displayName),
    name: displayName,
    price: FALLBACK_PRICE,
    original_price: FALLBACK_PRICE,
    discount_percent: 0,
    category: row.category ?? null,
    collection: row.collection ? String(row.collection).trim().toLowerCase() : null,
    image_url: url || null,
    image_urls: url ? [url] : [],
    is_new_arrival: false,
    in_stock: true,
    is_active: true,
    stripe_price_id: null,
    description: null,
    created_at: new Date(Date.UTC(2024, 0, 1) + index).toISOString(),
    has_variants: false,
    variants: emptyProductVariants(),
  }
}

function loadCatalogRows(): CatalogRow[] {
  const fromGenerated = (generatedCatalog as CatalogRow[]).filter((r) => r.name && r.image_url)
  if (fromGenerated.length > 0) {
    return fromGenerated.map((row) => ({
      ...row,
      name: formatProductDisplayName(String(row.name).trim()),
    }))
  }

  const seen = new Set<string>()
  const legacy: CatalogRow[] = []
  for (const row of masterCatalog) {
    const name = String((row as CatalogRow).name ?? '').trim()
    const formatted = formatProductDisplayName(name)
    const key = catalogRowKey({
      name: formatted,
      image_url: String((row as CatalogRow).image_url ?? ''),
      collection: (row as CatalogRow).collection ?? null,
      category: (row as CatalogRow).category ?? null,
    })
    if (!name || seen.has(key)) continue
    seen.add(key)
    legacy.push({
      name: formatted,
      image_url: sanitizeMasterUrl((row as CatalogRow).image_url),
      collection: (row as CatalogRow).collection ?? null,
      category: (row as CatalogRow).category ?? null,
    })
  }
  return legacy
}

let cachedMasterProducts: AdminProduct[] | null = null

export function clearMasterCatalogCache(): void {
  cachedMasterProducts = null
}

/** Catálogo local cuando Supabase no responde (p. ej. cuota de egress). */
export function getMasterCatalogProducts(): AdminProduct[] {
  if (cachedMasterProducts) return cachedMasterProducts
  const rows = loadCatalogRows()
  cachedMasterProducts = dedupeMasterProducts(rows.map((row, index) => mapMasterRow(row, index)))
  return cachedMasterProducts
}

export function findMasterCatalogProductById(id: string): AdminProduct | null {
  const normalized = String(id ?? '').trim()
  if (!normalized.startsWith('mc-')) return null
  return getMasterCatalogProducts().find((p) => p.id === normalized) ?? null
}

export function findMasterCatalogProductByNameSlug(slug: string): AdminProduct | null {
  const needle = String(slug ?? '').trim().toLowerCase()
  if (!needle) return null
  return (
    getMasterCatalogProducts().find((p) => slugifyCollectionLabel(p.name) === needle) ??
    getMasterCatalogProducts().find((p) => p.name.toLowerCase().includes(needle.replace(/-/g, ' '))) ??
    null
  )
}

export function isSupabaseQuotaOrUnavailableError(message: string | null | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return (
    m.includes('exceed') ||
    m.includes('restricted') ||
    m.includes('quota') ||
    m.includes('service for this project')
  )
}
