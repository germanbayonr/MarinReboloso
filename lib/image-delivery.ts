import { imageUrlsFromProductRow } from '@/lib/home-page-images'

export type ProductImageVariant = 'grid' | 'detail' | 'thumb'

const SUPABASE_PUBLIC_MARKER = '/storage/v1/object/public/'

/** Normaliza URL sin romper rutas codificadas (%20, acentos, etc.). */
export function normalizeProductImageUrl(raw: string): string {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return ''
  // Solo corregir doble-encoding (%2520 → %20), nunca decodificar URLs ya válidas.
  if (trimmed.includes('%25')) {
    try {
      return decodeURIComponent(trimmed)
    } catch {
      return trimmed
    }
  }
  return trimmed
}

export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('.supabase.co') && url.includes('/storage/')
}

export function isBunnyCdnUrl(url: string): boolean {
  return url.includes('marebo.b-cdn.net') || url.includes('b-cdn.net')
}

/**
 * URL de entrega optimizada. Los ficheros ya se comprimen al subir (WebP ~960px).
 * No usamos transformaciones on-the-fly de Supabase para no duplicar egress.
 */
export function productImageUrl(raw: string, _variant: ProductImageVariant = 'grid'): string {
  return normalizeProductImageUrl(raw)
}

export function productImageUrlsFromRow(
  imageUrl: unknown,
  variant: ProductImageVariant = 'grid',
): string[] {
  return imageUrlsFromProductRow(imageUrl).map((url) => productImageUrl(url, variant))
}

export function collectUniqueImageUrls(urls: Iterable<string>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of urls) {
    const url = normalizeProductImageUrl(raw)
    if (!url || seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

export function collectImageUrlsFromProducts(
  products: Array<{ image_url?: unknown; image_urls?: string[] | null; variants?: unknown }>,
): string[] {
  const urls: string[] = []
  for (const product of products) {
    urls.push(...productImageUrlsFromRow(product.image_url, 'grid'))
    if (Array.isArray(product.image_urls)) {
      for (const u of product.image_urls) {
        if (u) urls.push(productImageUrl(u, 'grid'))
      }
    }
    const variants = product.variants as { items?: Array<{ image_url?: string; image_urls?: string[] }> } | null
    if (variants?.items?.length) {
      for (const item of variants.items) {
        if (item.image_url) urls.push(productImageUrl(item.image_url, 'grid'))
        for (const u of item.image_urls ?? []) {
          if (u) urls.push(productImageUrl(u, 'grid'))
        }
      }
    }
  }
  return collectUniqueImageUrls(urls)
}

/** Cabecera Cache-Control para uploads inmutables (nombre UUID). */
export const STORAGE_IMMUTABLE_CACHE_CONTROL = '31536000, immutable'
