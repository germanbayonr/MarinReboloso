import { allImageUrlsFromDatabase, imageUrlFirstFromDatabase } from '@/lib/admin/product-image-db'
import { emptyProductVariants, parseProductVariants } from '@/lib/product-variants'
import { formatProductDisplayName } from '@/lib/format-product-name'
import type { AdminProduct } from '@/lib/admin/types'

export function mapProductRow(p: Record<string, unknown>): AdminProduct {
  const hasVariants = p.has_variants === true
  const variants = parseProductVariants(p.variants)
  return {
    id: String(p.id),
    name: formatProductDisplayName(String(p.name ?? '')),
    price: Number(p.price) || 0,
    original_price: p.original_price != null ? Number(p.original_price) : null,
    discount_percent: Number(p.discount_percent) || 0,
    category: (p.category as string) ?? null,
    collection: (p.collection as string) ?? null,
    image_url: imageUrlFirstFromDatabase(p.image_url),
    image_urls: allImageUrlsFromDatabase(p.image_url),
    is_new_arrival: Boolean(p.is_new_arrival),
    in_stock: typeof p.in_stock === 'boolean' ? p.in_stock : true,
    is_active: typeof p.is_active === 'boolean' ? p.is_active : true,
    stripe_price_id: (p.stripe_price_id as string) ?? null,
    description: (p.description as string) ?? null,
    created_at: p.created_at != null ? String(p.created_at) : null,
    has_variants: hasVariants,
    variants: hasVariants ? variants : emptyProductVariants(),
  }
}
