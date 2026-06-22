import { mapProductRow } from '@/lib/admin/map-product'
import type { AdminProduct } from '@/lib/admin/types'
import { HOME_PAGE_STATIC_IMAGE_URLS } from '@/lib/home-page-images'
import { collectUniqueImageUrls, productImageUrl } from '@/lib/image-delivery'
import { allDisplayImagesForProduct } from '@/lib/product-display-images'
import { getHiddenCollectionSlugs } from '@/lib/collections'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getMasterCatalogProducts, isSupabaseQuotaOrUnavailableError } from '@/lib/master-catalog-products'

const PRODUCT_SELECT_LITE =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,has_variants,variants'

const PRODUCT_SELECT_LITE_LEGACY =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at'

export interface SiteCatalogSnapshot {
  version: 1
  fetchedAt: string
  fromFallback: boolean
  hiddenCollectionSlugs: string[]
  products: AdminProduct[]
  imageUrls: string[]
}

function isMissingVariantsColumnError(message: string | null | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return m.includes('has_variants') || m.includes('variants')
}

function imageUrlsFromCollections(
  rows: Array<{ hero_image_left?: string | null; hero_image_right?: string | null }>,
): string[] {
  const urls: string[] = []
  for (const row of rows) {
    if (row.hero_image_left) urls.push(productImageUrl(String(row.hero_image_left)))
    if (row.hero_image_right) urls.push(productImageUrl(String(row.hero_image_right)))
  }
  return urls
}

/** Una sola consulta de catálogo + imágenes para toda la web (prioridad: datos del panel en Supabase). */
export async function buildSiteCatalogSnapshot(): Promise<SiteCatalogSnapshot> {
  const hiddenCollectionSlugs = Array.from(await getHiddenCollectionSlugs())
  let products: AdminProduct[] = []
  let fromFallback = false
  let collectionHeroUrls: string[] = []

  try {
    const sb = createSupabaseServerClient()
    let { data, error } = await sb
      .from('products')
      .select(PRODUCT_SELECT_LITE)
      .eq('is_active', true)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(5000)

    if (error && isMissingVariantsColumnError(error.message)) {
      const legacy = await sb
        .from('products')
        .select(PRODUCT_SELECT_LITE_LEGACY)
        .eq('is_active', true)
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(5000)
      data = legacy.data
      error = legacy.error
    }

    if (error) {
      if (isSupabaseQuotaOrUnavailableError(error.message)) {
        products = getMasterCatalogProducts()
        fromFallback = true
      } else {
        throw new Error(error.message)
      }
    } else {
      products = (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>))
    }

    if (!fromFallback) {
      const { data: collections } = await sb
        .from('collections')
        .select('hero_image_left,hero_image_right')
        .eq('visible_on_site', true)
      collectionHeroUrls = imageUrlsFromCollections(collections ?? [])
    }
  } catch {
    products = getMasterCatalogProducts()
    fromFallback = true
  }

  const productImageUrls = products.flatMap((p) =>
    allDisplayImagesForProduct(p).map((u) => productImageUrl(String(u))),
  )

  const imageUrls = collectUniqueImageUrls([
    ...HOME_PAGE_STATIC_IMAGE_URLS,
    ...collectionHeroUrls,
    ...productImageUrls,
  ])

  return {
    version: 1,
    fetchedAt: new Date().toISOString(),
    fromFallback,
    hiddenCollectionSlugs,
    products,
    imageUrls,
  }
}
