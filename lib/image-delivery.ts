import { imageUrlsFromProductRow } from '@/lib/home-page-images'

export type ProductImageVariant = 'grid' | 'detail' | 'thumb'

const SUPABASE_PUBLIC_MARKER = '/storage/v1/object/public/'
const PRODUCT_IMAGES_PUBLIC_PREFIX = `${SUPABASE_PUBLIC_MARKER}product-images/`

function bunnyCdnHost(): string {
  return (process.env.NEXT_PUBLIC_BUNNY_CDN_HOST ?? 'marebo.b-cdn.net').replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

/** URL de entrega en tienda: opcionalmente sirve ficheros de Storage vía Bunny (menos egress Supabase). */
export function deliveryProductImageUrl(raw: string): string {
  const normalized = normalizeProductImageUrl(raw)
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized) && isBunnyCdnUrl(normalized)) return normalized

  const useBunny = process.env.NEXT_PUBLIC_USE_BUNNY_FOR_PRODUCT_IMAGES === 'true'
  if (!useBunny) return normalized

  const host = bunnyCdnHost()
  if (!host) return normalized

  let storagePath = ''
  const idx = normalized.indexOf(PRODUCT_IMAGES_PUBLIC_PREFIX)
  if (idx >= 0) {
    storagePath = normalized.slice(idx + PRODUCT_IMAGES_PUBLIC_PREFIX.length)
  } else if (!/^https?:\/\//i.test(normalized)) {
    storagePath = normalized.replace(/^\/+/, '')
    if (!storagePath.startsWith('products/')) {
      storagePath = storagePath.includes('/') ? storagePath : `products/${storagePath}`
    }
  }

  if (storagePath) {
    const segments = storagePath.split('/').map((seg) => encodeURIComponent(seg))
    return `https://${host}/${segments.join('/')}`
  }

  return normalized
}

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

const PRODUCT_IMAGES_BUCKET = 'product-images'

/**
 * En el admin, algunas filas antiguas guardan solo el nombre de fichero o la ruta relativa en Storage.
 * Convierte a URL pública absoluta para `<img>` y descargas.
 */
export function resolveAdminPanelImageUrl(raw: string): string {
  const normalized = normalizeProductImageUrl(raw)
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return deliveryProductImageUrl(normalized)

  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
  if (!base) return normalized

  const path = normalized.replace(/^\/+/, '')
  let absolute = normalized
  if (path.startsWith(`${PRODUCT_IMAGES_BUCKET}/`)) {
    absolute = `${base}/storage/v1/object/public/${path}`
  } else if (path.startsWith('products/')) {
    absolute = `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`
  } else if (/^[a-f0-9-]{36}\.webp$/i.test(path) || path.endsWith('.webp') || path.endsWith('.jpg') || path.endsWith('.png')) {
    const file = path.includes('/') ? path : `products/${path}`
    absolute = `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${file}`
  }
  return deliveryProductImageUrl(absolute)
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
  return deliveryProductImageUrl(raw)
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
