import { slugifyCollectionLabel } from '@/lib/collection-slug'
import { formatProductDisplayName } from '@/lib/format-product-name'
import { isProductUuid } from '@/lib/shop-client-storage'
import type { AdminProduct } from '@/lib/admin/types'

export interface ProductVariantItem {
  id: string
  color: string | null
  size: string | null
  image_url: string
  /** Todas las imágenes de esta variante (p. ej. duplicados negras/negros en BD). */
  image_urls?: string[]
  in_stock: boolean
}

export interface ProductVariantsData {
  colors: string[]
  sizes: string[]
  items: ProductVariantItem[]
}

export function emptyProductVariants(): ProductVariantsData {
  return { colors: [], sizes: [], items: [] }
}

export function parseProductVariants(raw: unknown): ProductVariantsData {
  if (raw == null || typeof raw !== 'object') return emptyProductVariants()
  const o = raw as Record<string, unknown>
  const colors = Array.isArray(o.colors) ? o.colors.map((c) => String(c).trim()).filter(Boolean) : []
  const sizes = Array.isArray(o.sizes) ? o.sizes.map((s) => String(s).trim()).filter(Boolean) : []
  const items = Array.isArray(o.items)
    ? o.items
        .map((item) => {
          if (item == null || typeof item !== 'object') return null
          const row = item as Record<string, unknown>
          const image_url = String(row.image_url ?? '').trim()
          if (!image_url) return null
          return {
            id: String(row.id ?? `var-${items.length}`),
            color: row.color != null ? String(row.color).trim() || null : null,
            size: row.size != null ? String(row.size).trim() || null : null,
            image_url,
            in_stock: row.in_stock !== false,
          } satisfies ProductVariantItem
        })
        .filter((x): x is ProductVariantItem => x != null)
    : []
  return { colors, sizes, items }
}

const VARIANT_TOKENS = new Set(
  [
    'carmín',
    'carmin',
    'turquesa',
    'turquesas',
    'marfil',
    'nácar',
    'nacar',
    'noir',
    'esmeralda',
    'rubí',
    'rubi',
    'coral',
    'corales',
    'ivory',
    'cocoa',
    'sky',
    'salmon',
    'salmón',
    'fucsia',
    'negros',
    'negra',
    'negras',
    'blancos',
    'naranjas',
    'rojos',
    'crudo',
    'crudos',
    'pistacho',
    'azul',
    'verde',
    'dorados',
    'dorado',
    'grandes',
    'grande',
    'pequeños',
    'pequeño',
    'pequenos',
    'pequeno',
    'little',
    'imperial',
    'buganvilla',
    'rosa',
    'jade',
    'vino',
    'profunda',
    'empolvado',
    'real',
    'antiguo',
    'electric',
    'blue',
    'bottle',
    'green',
    'pistachio',
  ].map((t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()),
)

function normalizeToken(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Clave canónica para agrupar colores equivalentes (negras ≈ negros). */
export function normalizeVariantColorKey(color: string | null | undefined): string | null {
  if (!color?.trim()) return null
  const n = normalizeToken(color)
  if (['negros', 'negras', 'negra'].includes(n)) return 'negros'
  if (['turquesas', 'turquesa'].includes(n)) return 'turquesa'
  if (['blancos', 'blanco'].includes(n)) return 'blancos'
  if (['naranjas', 'naranja'].includes(n)) return 'naranjas'
  if (['rojos', 'rojo'].includes(n)) return 'rojos'
  if (['dorados', 'dorado'].includes(n)) return 'dorados'
  return n
}

/** Etiqueta visible unificada para el selector de color. */
export function canonicalColorLabel(color: string): string {
  const key = normalizeVariantColorKey(color)
  const labels: Record<string, string> = {
    negros: 'Negros',
    turquesa: 'Turquesa',
    blancos: 'Blancos',
    naranjas: 'Naranjas',
    rojos: 'Rojos',
    dorados: 'Dorados',
    fucsia: 'Fucsia',
    marfil: 'Marfil',
    carmin: 'Carmín',
  }
  if (key && labels[key]) return labels[key]
  return color.trim().charAt(0).toUpperCase() + color.trim().slice(1)
}

function colorsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return normalizeVariantColorKey(a) === normalizeVariantColorKey(b)
}

function allImageUrlsFromProduct(p: AdminProduct): string[] {
  const fromArray = (p.image_urls ?? []).map((u) => String(u).trim()).filter(Boolean)
  if (fromArray.length > 0) return fromArray
  const single = p.image_url?.trim()
  return single ? [single] : []
}

/** Quita el último token si parece color/tamaño (p. ej. «Pendientes Aura Carmín» → «Pendientes Aura»). */
export function getProductBaseName(name: string): string {
  const formatted = formatProductDisplayName(String(name ?? '').trim())
  const parts = formatted.split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return formatted
  const last = normalizeToken(parts[parts.length - 1])
  if (!VARIANT_TOKENS.has(last)) return formatted
  return parts.slice(0, -1).join(' ').trim()
}

function inferVariantSuffix(fullName: string, baseName: string): { color: string | null; size: string | null } {
  const suffix = fullName.slice(baseName.length).trim()
  if (!suffix) return { color: null, size: null }
  const norm = normalizeToken(suffix)
  if (['grandes', 'grande', 'pequeños', 'pequeño', 'pequenos', 'pequeno', 'little'].includes(norm)) {
    return { color: null, size: suffix }
  }
  return { color: suffix, size: null }
}

export type StorefrontProduct = AdminProduct & {
  /** Variantes efectivas para la ficha (DB o agrupación automática). */
  display_variants: ProductVariantsData | null
  grouped_from_ids?: string[]
  /** Slug público agrupado (`grp-...`) cuando difiere del id de checkout. */
  storefront_group_id?: string | null
  /** UUID de Supabase usado en carrito y Stripe. */
  checkout_product_id?: string | null
}

function variantItemFromProduct(p: AdminProduct): ProductVariantItem {
  const ownBase = getProductBaseName(p.name)
  const { color, size } = inferVariantSuffix(p.name, ownBase)
  const urls = allImageUrlsFromProduct(p)
  const displayColor = color ? canonicalColorLabel(color) : null
  return {
    id: p.id,
    color: displayColor,
    size,
    image_url: urls[0] ?? '',
    image_urls: urls,
    in_stock: p.in_stock !== false,
  }
}

function mergeVariantItemsByColorAndSize(items: ProductVariantItem[]): ProductVariantItem[] {
  const map = new Map<string, ProductVariantItem>()

  for (const item of items) {
    if (!item.image_url) continue
    const colorKey = normalizeVariantColorKey(item.color) ?? ''
    const sizeKey = normalizeToken(item.size ?? '')
    const key = `${colorKey}::${sizeKey}`

    const incomingUrls = [...(item.image_urls ?? []), item.image_url].filter(Boolean)
    const existing = map.get(key)

    if (!existing) {
      const uniqueUrls = [...new Set(incomingUrls)]
      map.set(key, {
        ...item,
        color: item.color ? canonicalColorLabel(item.color) : null,
        image_urls: uniqueUrls,
        image_url: uniqueUrls[0] ?? item.image_url,
        in_stock: item.in_stock !== false,
      })
      continue
    }

    const mergedUrls = [...new Set([...(existing.image_urls ?? []), ...incomingUrls])]
    map.set(key, {
      ...existing,
      image_urls: mergedUrls,
      image_url: mergedUrls[0] ?? existing.image_url,
      in_stock: existing.in_stock !== false && item.in_stock !== false,
    })
  }

  return Array.from(map.values())
}

function buildVariantsFromItems(items: ProductVariantItem[]): ProductVariantsData {
  const merged = mergeVariantItemsByColorAndSize(items)
  const colorsByKey = new Map<string, string>()
  for (const i of merged) {
    if (!i.color) continue
    const key = normalizeVariantColorKey(i.color) ?? normalizeToken(i.color)
    if (!colorsByKey.has(key)) colorsByKey.set(key, canonicalColorLabel(i.color))
  }
  const colors = Array.from(colorsByKey.values())
  const sizes = [...new Set(merged.map((i) => i.size).filter((s): s is string => !!s))]
  return { colors, sizes, items: merged }
}

function prettifyGroupDisplayName(members: AdminProduct[]): string {
  const bases = members.map((m) => getProductBaseName(formatProductDisplayName(m.name)))
  const best = [...new Set(bases)].sort((a, b) => b.length - a.length)[0] ?? ''
  if (!best) return formatProductDisplayName(getProductBaseName(members[0].name))
  return best
}

/** Normaliza nombres base para agrupar duplicados de catálogo (espacios, typos). */
function normalizeProductBaseNameForGrouping(name: string): string {
  return formatProductDisplayName(name)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function mergeGroupedProduct(members: AdminProduct[], collection: string | null): StorefrontProduct {
  const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const lead = sorted[0]
  const baseName = prettifyGroupDisplayName(sorted)
  const items = sorted.map((p) => variantItemFromProduct(p))
  const variants = buildVariantsFromItems(items)
  const colSlug = collection ? slugifyCollectionLabel(collection) : 'general'
  const groupId = `grp-${colSlug}-${slugifyCollectionLabel(baseName)}`
  const checkoutProductId = sorted.find((p) => isProductUuid(p.id))?.id ?? null
  const memberGalleryUrls = sorted.flatMap((p) => allImageUrlsFromProduct(p))
  const variantUrls = variants.items.flatMap((i) => i.image_urls ?? [i.image_url]).filter(Boolean)
  const allUrls = [...new Set([...memberGalleryUrls, ...variantUrls])]

  return {
    ...lead,
    id: groupId,
    storefront_group_id: groupId,
    checkout_product_id: checkoutProductId,
    name: baseName,
    has_variants: true,
    variants,
    display_variants: variants,
    grouped_from_ids: sorted.map((p) => p.id),
    image_url: allUrls[0] ?? lead.image_url,
    image_urls: allUrls,
  }
}

/** Unifica productos con nombre base común en un solo producto con variantes. */
export function groupSimilarProductsForStorefront(products: AdminProduct[]): StorefrontProduct[] {
  const explicit: StorefrontProduct[] = []
  const toGroup = new Map<string, AdminProduct[]>()
  const consumed = new Set<string>()

  for (const p of products) {
    if (p.has_variants && p.variants.items.length > 0) {
      const galleryUrls = allImageUrlsFromProduct(p)
      const variantUrls = p.variants.items.flatMap((i) => i.image_urls ?? [i.image_url]).filter(Boolean)
      const allUrls = [...new Set([...galleryUrls, ...variantUrls])]
      explicit.push({
        ...p,
        display_variants: buildVariantsFromItems(p.variants.items),
        image_url: allUrls[0] ?? p.image_url,
        image_urls: allUrls,
      })
      consumed.add(p.id)
      continue
    }
    const base = normalizeProductBaseNameForGrouping(getProductBaseName(p.name))
    if (base === normalizeProductBaseNameForGrouping(p.name.trim())) {
      continue
    }
    const col = p.collection ?? ''
    const key = `${col}::${base}`
    const list = toGroup.get(key) ?? []
    list.push(p)
    toGroup.set(key, list)
  }

  const grouped: StorefrontProduct[] = []
  for (const [, members] of toGroup) {
    if (members.length < 2) continue
    for (const m of members) consumed.add(m.id)
    grouped.push(mergeGroupedProduct(members, members[0].collection))
  }

  const singles: StorefrontProduct[] = products
    .filter((p) => !consumed.has(p.id))
    .map((p) => {
      const urls = allImageUrlsFromProduct(p)
      return {
        ...p,
        image_url: urls[0] ?? p.image_url,
        image_urls: urls,
        display_variants: p.has_variants && p.variants.items.length ? p.variants : null,
      }
    })

  return dedupeStorefrontProductsById([...explicit, ...grouped, ...singles])
}

function dedupeStorefrontProductsById(products: StorefrontProduct[]): StorefrontProduct[] {
  const merged = new Map<string, StorefrontProduct>()

  for (const product of products) {
    const existing = merged.get(product.id)
    if (!existing) {
      merged.set(product.id, product)
      continue
    }

    const urls = [
      ...new Set(
        [...(existing.image_urls ?? []), ...(product.image_urls ?? []), existing.image_url, product.image_url]
          .map((u) => String(u ?? '').trim())
          .filter(Boolean),
      ),
    ]

    merged.set(product.id, {
      ...existing,
      image_urls: urls,
      image_url: urls[0] ?? existing.image_url,
    })
  }

  return Array.from(merged.values())
}

export function variantLabel(item: ProductVariantItem): string {
  const parts = [item.color, item.size].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Único'
}

export function findVariantItem(
  variants: ProductVariantsData | null | undefined,
  color: string | null,
  size: string | null,
): ProductVariantItem | null {
  if (!variants?.items.length) return null
  const exact = variants.items.find(
    (item) => colorsMatch(item.color, color) && (size == null || item.size === size),
  )
  if (exact) return exact
  if (color) {
    const byColor = variants.items.find((item) => colorsMatch(item.color, color))
    if (byColor) return byColor
  }
  if (size) {
    const bySize = variants.items.find((item) => item.size === size)
    if (bySize) return bySize
  }
  return variants.items[0] ?? null
}

/** Imágenes de la variante seleccionada (varias si negras/negros u otras entradas duplicadas en BD). */
export function findVariantImages(
  variants: ProductVariantsData | null | undefined,
  color: string | null,
  size: string | null,
): string[] {
  const item = findVariantItem(variants, color, size)
  if (!item) return []
  const urls = [...(item.image_urls ?? []), item.image_url].filter(Boolean)
  return [...new Set(urls)]
}

export function resolveStorefrontProductById(
  products: StorefrontProduct[],
  id: string,
): StorefrontProduct | null {
  const direct = products.find((p) => p.id === id || p.storefront_group_id === id)
  if (direct) return direct
  for (const p of products) {
    if (p.grouped_from_ids?.includes(id)) return p
    if (p.variants.items.some((item) => item.id === id)) return p
  }
  return null
}
