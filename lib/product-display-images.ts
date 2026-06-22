import { allImageUrlsFromDatabase } from '@/lib/admin/product-image-db'
import { normalizeProductImageUrl } from '@/lib/image-delivery'
import type { ProductVariantsData } from '@/lib/product-variants'

export interface ProductImageFields {
  image_url?: string | string[] | null
  image_urls?: string[] | null
  variants?: ProductVariantsData | null
}

function variantImageUrls(variants?: ProductVariantsData | null): string[] {
  if (!variants?.items?.length) return []
  return variants.items.flatMap((item) => {
    const urls = [...(item.image_urls ?? []), item.image_url].filter(Boolean) as string[]
    return urls.map((u) => normalizeProductImageUrl(String(u))).filter(Boolean)
  })
}

/** Todas las imágenes de un producto para grid/ficha (galería + variantes). */
export function allDisplayImagesForProduct(product: ProductImageFields): string[] {
  const fromUrls = (product.image_urls ?? [])
    .map((u) => normalizeProductImageUrl(String(u)))
    .filter(Boolean)
  const fromImageUrlField = (() => {
    if (Array.isArray(product.image_url)) {
      return product.image_url.map((u) => normalizeProductImageUrl(String(u))).filter(Boolean)
    }
    if (product.image_url != null && String(product.image_url).trim()) {
      const u = normalizeProductImageUrl(String(product.image_url))
      return u ? [u] : []
    }
    return []
  })()

  const merged = [...new Set([...fromUrls, ...fromImageUrlField, ...variantImageUrls(product.variants)])]
  return merged
}

/** Campo `image_url` del grid: array si hay varias, string si hay una, null si ninguna. */
export function gridImageFieldForProduct(
  product: ProductImageFields,
): string[] | string | null {
  const urls = allDisplayImagesForProduct(product)
  if (urls.length === 0) return null
  if (urls.length === 1) return urls[0]
  return urls
}

/** Fusiona URLs existentes en BD con las nuevas (nunca quita las existentes). */
export function mergeProductImageUrls(existingRaw: unknown, incoming: string[]): string[] {
  const existing = allImageUrlsFromDatabase(existingRaw)
  const merged = [...existing]
  for (const url of incoming) {
    const normalized = normalizeProductImageUrl(String(url))
    if (!normalized) continue
    if (!merged.includes(normalized)) merged.push(normalized)
  }
  return merged
}
