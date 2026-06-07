import { mapProductRow } from '@/lib/admin/map-product'
import type { AdminProduct } from '@/lib/admin/types'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { collectionSlugsForProductFilter } from '@/lib/collections'

const PRODUCT_SELECT =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at'

/** Productos visibles en tienda para una colección (misma lógica que el panel admin). */
export async function fetchProductsForCollectionSlug(slug: string): Promise<{
  products: AdminProduct[]
  error: string | null
}> {
  const normalized = String(slug ?? '').toLowerCase().trim()
  if (!normalized) return { products: [], error: 'Slug vacío' }

  const sb = createSupabaseServerClient()
  const slugs = collectionSlugsForProductFilter(normalized)

  let query = sb
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)

  if (slugs.length > 1) {
    query = query.or(slugs.map((s) => `collection.ilike.${s}`).join(','))
  } else {
    query = query.ilike('collection', slugs[0] ?? normalized)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(500)

  if (error) return { products: [], error: error.message }

  const products = (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>))
  return { products, error: null }
}

export function toCollectionGridProducts(products: AdminProduct[]) {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    original_price: p.original_price,
    discount_percent: p.discount_percent,
    in_stock: p.in_stock,
    image_url: p.image_urls && p.image_urls.length > 0 ? p.image_urls : p.image_url,
    category: p.category,
    collection: p.collection,
    is_new_arrival: p.is_new_arrival,
    created_at: p.created_at,
  }))
}
