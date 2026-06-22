import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ProductStripeRow {
  id: string
  name: string
  price: number | string
  stripe_product_id: string | null
  stripe_price_id: string | null
  image_url?: unknown
  description?: string | null
}

function unitAmountFromPrice(price: number | string): number {
  return Math.round(Number(price) * 100)
}

function firstImageUrl(imageUrl: unknown): string | null {
  if (typeof imageUrl === 'string' && imageUrl.trim()) return imageUrl.trim()
  if (Array.isArray(imageUrl)) {
    const first = imageUrl.find((item) => typeof item === 'string' && item.trim())
    return first ? String(first).trim() : null
  }
  return null
}

/** Crea o repara producto/precio en Stripe y persiste ids en Supabase. */
export async function ensureStripePriceForProduct({
  stripe,
  supabase,
  product,
}: {
  stripe: Stripe
  supabase: SupabaseClient
  product: ProductStripeRow
}): Promise<string | null> {
  const productId = String(product.id)
  const expectedUnitAmount = unitAmountFromPrice(product.price)
  if (!Number.isFinite(expectedUnitAmount) || expectedUnitAmount <= 0) return null

  let stripeProductId = product.stripe_product_id ? String(product.stripe_product_id) : ''
  let stripePriceId = product.stripe_price_id ? String(product.stripe_price_id) : ''

  if (stripePriceId) {
    try {
      const current = await stripe.prices.retrieve(stripePriceId, { expand: ['product'] })
      const linkedProductId =
        typeof current.product === 'string' ? current.product : current.product?.id ?? ''
      if (linkedProductId) stripeProductId = linkedProductId

      const stripeProduct =
        typeof current.product === 'string'
          ? await stripe.products.retrieve(current.product)
          : current.product
      const productActive =
        Boolean(stripeProduct) &&
        !('deleted' in stripeProduct && stripeProduct.deleted) &&
        stripeProduct.active !== false

      const priceMatches =
        current.active &&
        current.currency === 'eur' &&
        current.unit_amount === expectedUnitAmount &&
        !current.recurring

      if (priceMatches && productActive) return stripePriceId

      if (priceMatches && linkedProductId) {
        await stripe.products.update(linkedProductId, {
          active: true,
          name: String(product.name ?? 'Producto Marebo').trim() || 'Producto Marebo',
        })
        return stripePriceId
      }
    } catch {
      stripePriceId = ''
    }
  }

  if (!stripeProductId) {
    const createdProduct = await stripe.products.create({
      name: String(product.name ?? 'Producto Marebo').trim() || 'Producto Marebo',
      description: product.description?.trim() || undefined,
      images: (() => {
        const url = firstImageUrl(product.image_url)
        return url ? [url] : undefined
      })(),
      active: true,
    })
    stripeProductId = createdProduct.id
  }

  const freshPrice = await stripe.prices.create({
    product: stripeProductId,
    unit_amount: expectedUnitAmount,
    currency: 'eur',
  })

  await supabase
    .from('products')
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: freshPrice.id,
    })
    .eq('id', productId)

  try {
    await stripe.products.update(stripeProductId, {
      name: String(product.name ?? 'Producto Marebo').trim() || 'Producto Marebo',
      description: product.description?.trim() || undefined,
      active: true,
    })
  } catch {
    // No bloquear checkout si falla metadata
  }

  return freshPrice.id
}
