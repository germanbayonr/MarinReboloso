export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/ProductDetailClient'
import { fetchActiveProducts, fetchProductRowById } from '@/lib/products-data-source'
import {
  groupSimilarProductsForStorefront,
  resolveStorefrontProductById,
  type StorefrontProduct,
} from '@/lib/product-variants'
import { allDisplayImagesForProduct } from '@/lib/product-display-images'

async function resolveStorefrontProduct(id: string): Promise<StorefrontProduct | null> {
  const trimmed = String(id ?? '').trim()
  if (!trimmed) return null

  const { products } = await fetchActiveProducts()
  const grouped = groupSimilarProductsForStorefront(products)
  const fromGroup = resolveStorefrontProductById(grouped, trimmed)
  if (fromGroup) return fromGroup

  const { product } = await fetchProductRowById(trimmed, { includeInactive: true })
  if (!product) return null
  const urls = allDisplayImagesForProduct(product)
  return {
    ...product,
    image_url: urls[0] ?? product.image_url,
    image_urls: urls,
    display_variants: product.has_variants && product.variants.items.length ? product.variants : null,
  }
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await resolveStorefrontProduct(id)
  if (!product) notFound()

  return <ProductDetailClient product={product} />
}
