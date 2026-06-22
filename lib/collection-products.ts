import type { AdminProduct } from '@/lib/admin/types'
import { gridImageFieldForProduct } from '@/lib/product-display-images'
import { fetchProductsForCollectionSlugData } from '@/lib/products-data-source'
import { groupSimilarProductsForStorefront, type StorefrontProduct } from '@/lib/product-variants'

/** Productos visibles en tienda para una colección (Supabase + fallback catálogo maestro). */
export async function fetchProductsForCollectionSlug(slug: string): Promise<{
  products: AdminProduct[]
  storefrontProducts: StorefrontProduct[]
  fromFallback: boolean
  error: string | null
}> {
  const { products, fromFallback, error } = await fetchProductsForCollectionSlugData(slug)
  const storefrontProducts = groupSimilarProductsForStorefront(products)
  return { products, storefrontProducts, fromFallback, error }
}

export function toCollectionGridProducts(products: StorefrontProduct[]) {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    original_price: p.original_price,
    discount_percent: p.discount_percent,
    in_stock: p.in_stock,
    image_url: gridImageFieldForProduct(p),
    category: p.category,
    collection: p.collection,
    is_new_arrival: p.is_new_arrival,
    created_at: p.created_at,
    has_variants: p.has_variants || (p.display_variants?.items.length ?? 0) > 1,
  }))
}
