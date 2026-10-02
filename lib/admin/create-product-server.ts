import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { imageUrlsForDatabaseColumn } from '@/lib/admin/product-image-db'
import { insertProductRow } from '@/lib/admin/product-db-write'
import type { AdminProductInput } from '@/lib/admin/product-input'
import { productMutationErrorResult } from '@/lib/admin/product-mutation-errors'
import { normalizeProductCollectionInput } from '@/lib/admin/product-collections'
import { getAllowedCollectionSlugs } from '@/lib/collections'
import { findOrCreateStripeProductLink, listAllActiveStripeProducts } from '@/lib/admin/stripe-product-link'
import { stripeSecretKey } from '@/lib/admin/stripe-secret-key'
import { computeFinalPrice } from '@/lib/pricing'
import { flattenVariantItemsGalleryUrls, normalizeVariantsForSave } from '@/lib/product-variants'
import { deliveryProductImageUrl } from '@/lib/image-delivery'

async function normalizeCollectionForProduct(raw: string | null | undefined): Promise<string | null> {
  const allowed = await getAllowedCollectionSlugs()
  return normalizeProductCollectionInput(raw, allowed)
}

export async function runCreateProduct(
  sb: SupabaseClient,
  input: AdminProductInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const secret = stripeSecretKey()
  if (!secret) {
    return { ok: false, error: 'Falta STRIPE_SECRET_KEY para crear y enlazar producto en Stripe.' }
  }

  const stripe = new Stripe(secret)
  const price = computeFinalPrice(input.original_price, input.discount_percent)
  const collection = await normalizeCollectionForProduct(input.collection)
  const normalizedVariants =
    input.has_variants && input.variants
      ? normalizeVariantsForSave(input.variants)
      : { colors: [], sizes: [], items: [] }
  const hasVariants = Boolean(input.has_variants && normalizedVariants.items.length)
  const variantImages = hasVariants ? flattenVariantItemsGalleryUrls(normalizedVariants.items) : []
  const imageInput = hasVariants && variantImages.length
    ? { image_url: variantImages[0], image_urls: variantImages }
    : input
  const columnUrls = imageUrlsForDatabaseColumn(imageInput)
  const primaryImageUrl =
    columnUrls.find((imageUrl) => typeof imageUrl === 'string' && imageUrl.trim()) ?? null
  const stripeImageUrl = primaryImageUrl ? deliveryProductImageUrl(primaryImageUrl) : null

  let stripeLink: { stripeProductId: string; stripePriceId: string }
  try {
    const stripeProducts = await listAllActiveStripeProducts(stripe)
    stripeLink = await findOrCreateStripeProductLink({
      stripe,
      stripeProducts,
      name: input.name.trim(),
      description: input.description,
      imageUrl: stripeImageUrl,
      amountEur: price,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al sincronizar con Stripe.'
    return { ok: false, error: errorMessage }
  }

  const insertPayload = {
    name: input.name,
    description: input.description,
    category: input.category,
    collection,
    image_url: columnUrls,
    is_new_arrival: input.is_new_arrival,
    in_stock: input.in_stock,
    is_active: true,
    original_price: input.original_price,
    discount_percent: input.discount_percent,
    price,
    stripe_product_id: stripeLink.stripeProductId,
    stripe_price_id: stripeLink.stripePriceId,
    has_variants: hasVariants,
    variants: hasVariants ? normalizedVariants : { colors: [], sizes: [], items: [] },
  }
  const { data, error, id: insertedId } = await insertProductRow(sb, insertPayload)
  if (error) return productMutationErrorResult('create', error.message)
  const newId = insertedId ?? String((data as { id?: string })?.id ?? '')
  if (newId) {
    const row = (data ?? {}) as Record<string, unknown>
    if (row.is_active === false) {
      await sb.from('products').update({ is_active: true }).eq('id', newId)
    }
  }
  if (!newId) return { ok: false, error: 'Producto creado pero no se obtuvo ID.' }
  return { ok: true, id: newId }
}
