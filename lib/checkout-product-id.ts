import { isProductUuid } from '@/lib/shop-client-storage'
import type { AdminProduct } from '@/lib/admin/types'
import {
  groupSimilarProductsForStorefront,
  resolveStorefrontProductById,
  type StorefrontProduct,
} from '@/lib/product-variants'

export function getCheckoutProductId(product: {
  id: string
  checkout_product_id?: string | null
  grouped_from_ids?: string[]
}): string {
  if (product.checkout_product_id && isProductUuid(product.checkout_product_id)) {
    return product.checkout_product_id
  }
  if (isProductUuid(product.id)) return product.id
  const fromGroup = product.grouped_from_ids?.find((candidate) => isProductUuid(candidate))
  if (fromGroup) return fromGroup
  return product.id
}

export function resolveCheckoutProductIdFromCatalog(
  productId: string,
  products: AdminProduct[],
): string | null {
  const trimmed = String(productId ?? '').trim()
  if (!trimmed) return null
  if (isProductUuid(trimmed)) return trimmed

  const grouped = groupSimilarProductsForStorefront(products) as StorefrontProduct[]
  const storefront = resolveStorefrontProductById(grouped, trimmed)
  if (!storefront) return null

  const checkoutId = getCheckoutProductId(storefront)
  return isProductUuid(checkoutId) ? checkoutId : null
}

export function resolveCheckoutProductIdsFromCatalog(
  productIds: string[],
  products: AdminProduct[],
): Map<string, string> {
  const resolved = new Map<string, string>()
  for (const id of productIds) {
    const checkoutId = resolveCheckoutProductIdFromCatalog(id, products)
    if (checkoutId) resolved.set(id, checkoutId)
  }
  return resolved
}
