import { cache } from 'react'
import { mapProductRow } from '@/lib/admin/map-product'
import type { AdminProduct } from '@/lib/admin/types'
import { productMatchesCollectionSlug } from '@/lib/collection-product-match'
import {
  getMasterCatalogProducts,
  isSupabaseQuotaOrUnavailableError,
} from '@/lib/master-catalog-products'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const PRODUCT_SELECT =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,has_variants,variants,description,stripe_price_id,stripe_product_id'

const PRODUCT_SELECT_LEGACY =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,description,stripe_price_id,stripe_product_id'

function isMissingVariantsColumnError(message: string | null | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return m.includes('has_variants') || m.includes('variants')
}

export interface ProductsFetchResult {
  products: AdminProduct[]
  fromFallback: boolean
  error: string | null
}

export const fetchActiveProducts = cache(async (): Promise<ProductsFetchResult> => {
  try {
    const sb = createSupabaseServerClient()
    let { data, error } = await sb
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(5000)

    if (error && isMissingVariantsColumnError(error.message)) {
      const legacy = await sb
        .from('products')
        .select(PRODUCT_SELECT_LEGACY)
        .eq('is_active', true)
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(5000)
      data = legacy.data
      error = legacy.error
    }

    if (error) {
      const useFallback = isSupabaseQuotaOrUnavailableError(error.message)
      if (useFallback) {
        console.warn('[products] Supabase no disponible, usando catálogo maestro local:', error.message)
        return { products: getMasterCatalogProducts(), fromFallback: true, error: error.message }
      }
      return { products: [], fromFallback: false, error: error.message }
    }

    const products = (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>))
    return { products, fromFallback: false, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    console.warn('[products] Excepción al cargar, usando catálogo maestro:', message)
    return { products: getMasterCatalogProducts(), fromFallback: true, error: message }
  }
})

export async function fetchProductsForCollectionSlugData(collectionSlug: string): Promise<ProductsFetchResult & { collectionSlug: string }> {
  const normalized = String(collectionSlug ?? '').toLowerCase().trim()
  const { products, fromFallback, error } = await fetchActiveProducts()
  let filtered = products.filter((p) => productMatchesCollectionSlug(p.collection, normalized))

  if (filtered.length === 0) {
    const fallbackForCollection = getMasterCatalogProducts().filter((p) =>
      productMatchesCollectionSlug(p.collection, normalized),
    )
    if (fallbackForCollection.length > 0) {
      filtered = fallbackForCollection
      return { products: filtered, fromFallback: true, error, collectionSlug: normalized }
    }
  }

  return { products: filtered, fromFallback, error, collectionSlug: normalized }
}

export async function fetchProductRowById(id: string): Promise<{
  product: AdminProduct | null
  fromFallback: boolean
  error: string | null
}> {
  const trimmed = String(id ?? '').trim()
  if (!trimmed) return { product: null, fromFallback: false, error: 'ID vacío' }

  if (trimmed.startsWith('mc-') || trimmed.startsWith('grp-')) {
    const { products } = await fetchActiveProducts()
    const { resolveStorefrontProductById, groupSimilarProductsForStorefront } = await import('@/lib/product-variants')
    const grouped = groupSimilarProductsForStorefront(products)
    const found = resolveStorefrontProductById(grouped, trimmed)
    return { product: found, fromFallback: true, error: null }
  }

  try {
    const sb = createSupabaseServerClient()
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
    let query = sb.from('products').select(PRODUCT_SELECT).eq('is_active', true)
    query = isUUID ? query.eq('id', trimmed) : query.ilike('name', trimmed.replace(/-/g, ' '))
    const { data, error } = await query.maybeSingle()

    if (error && isSupabaseQuotaOrUnavailableError(error.message)) {
      const { findMasterCatalogProductById, findMasterCatalogProductByNameSlug } = await import(
        '@/lib/master-catalog-products'
      )
      const fallback =
        findMasterCatalogProductById(trimmed) ?? findMasterCatalogProductByNameSlug(trimmed)
      return { product: fallback, fromFallback: true, error: error.message }
    }
    if (error) return { product: null, fromFallback: false, error: error.message }
    if (!data) {
      const { findMasterCatalogProductById, findMasterCatalogProductByNameSlug } = await import(
        '@/lib/master-catalog-products'
      )
      const fallback =
        findMasterCatalogProductById(trimmed) ?? findMasterCatalogProductByNameSlug(trimmed)
      return { product: fallback, fromFallback: !!fallback, error: null }
    }
    return { product: mapProductRow(data as Record<string, unknown>), fromFallback: false, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    const { findMasterCatalogProductById, findMasterCatalogProductByNameSlug } = await import(
      '@/lib/master-catalog-products'
    )
    const fallback =
      findMasterCatalogProductById(trimmed) ?? findMasterCatalogProductByNameSlug(trimmed)
    return { product: fallback, fromFallback: true, error: message }
  }
}
