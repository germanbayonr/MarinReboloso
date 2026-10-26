import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { imageUrlsForDatabaseColumn } from '@/lib/admin/product-image-db'
import { insertProductRow, updateProductRow } from '@/lib/admin/product-db-write'
import type { AdminProductInput } from '@/lib/admin/product-input'
import { productMutationErrorResult } from '@/lib/admin/product-mutation-errors'
import { normalizeProductCollectionInput } from '@/lib/admin/product-collections'
import { findOrCreateStripeProductLink, listAllActiveStripeProducts } from '@/lib/admin/stripe-product-link'
import { logAdminSupabaseIssue } from '@/lib/admin/supabase-admin-log'
import { stripeSecretKey } from '@/lib/admin/stripe-secret-key'
import { computeFinalPrice } from '@/lib/pricing'
import { flattenVariantItemsGalleryUrls, normalizeVariantsForSave } from '@/lib/product-variants'
import { deliveryProductImageUrl } from '@/lib/image-delivery'

function normalizeCollectionForProduct(raw: string | null | undefined): string | null {
  return normalizeProductCollectionInput(raw)
}

export async function runCreateProduct(
  sb: SupabaseClient,
  input: AdminProductInput,
): Promise<{ ok: true; id: string; stripeWarning: string | null } | { ok: false; error: string }> {
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
    stripe_product_id: null,
    stripe_price_id: null,
    has_variants: hasVariants,
    variants: hasVariants ? normalizedVariants : { colors: [], sizes: [], items: [] },
  }
  const { data, error, id: insertedId } = await insertProductRow(sb, insertPayload)
  if (error) return productMutationErrorResult('create', error.message)
  const newId = insertedId ?? String((data as { id?: string })?.id ?? '')
  if (!newId) return { ok: false, error: 'Producto creado pero no se obtuvo ID.' }

  const row = (data ?? {}) as Record<string, unknown>
  if (row.is_active === false) {
    await sb.from('products').update({ is_active: true }).eq('id', newId)
  }

  const stripeWarning = await linkCreatedProductToStripe(sb, {
    id: newId,
    name: input.name.trim(),
    description: input.description,
    price,
    imageUrl: stripeImageUrl,
  })

  return { ok: true, id: newId, stripeWarning }
}

async function linkCreatedProductToStripe(
  sb: SupabaseClient,
  product: {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
  },
): Promise<string | null> {
  const secret = stripeSecretKey()
  if (!secret) {
    const warning = 'Producto guardado en Supabase. Falta STRIPE_SECRET_KEY: no se enlazó el precio de pago.'
    logAdminSupabaseIssue('STRIPE_SYNC_FAILED', warning, { productId: product.id })
    return warning
  }

  try {
    const stripe = new Stripe(secret)
    const stripeProducts = await listAllActiveStripeProducts(stripe)
    const stripeLink = await findOrCreateStripeProductLink({
      stripe,
      stripeProducts,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      amountEur: product.price,
    })
    const updated = await updateProductRow(sb, product.id, {
      stripe_product_id: stripeLink.stripeProductId,
      stripe_price_id: stripeLink.stripePriceId,
    })
    if (updated.error) {
      const warning = `Producto guardado, pero no se pudo escribir el enlace de Stripe: ${updated.error.message}`
      logAdminSupabaseIssue('STRIPE_SYNC_FAILED', warning, { productId: product.id })
      return warning
    }
    return null
  } catch (error) {
    const warning =
      error instanceof Error
        ? `Producto guardado en Supabase. Stripe no se enlazó: ${error.message}`
        : 'Producto guardado en Supabase. Stripe no se enlazó.'
    logAdminSupabaseIssue('STRIPE_SYNC_FAILED', warning, { productId: product.id })
    return warning
  }
}
