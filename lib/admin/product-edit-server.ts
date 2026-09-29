import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchAdminProductById } from '@/lib/admin/fetch-admin-products'
import { normalizeProductCollectionInput } from '@/lib/admin/product-collections'
import { getAllowedCollectionSlugs } from '@/lib/collections'
import {
  imageUrlFirstFromDatabase,
  imageUrlsForDatabaseColumn,
} from '@/lib/admin/product-image-db'
import type { AdminProductInput } from '@/lib/admin/product-input'
import { productMutationErrorResult } from '@/lib/admin/product-mutation-errors'
import { updateProductRow } from '@/lib/admin/product-db-write'
import { removeProductImagesFromSupabaseStorage } from '@/lib/admin/remove-product-storage-images'
import { logAdminSupabaseIssue } from '@/lib/admin/supabase-admin-log'
import { stripeSecretKey } from '@/lib/admin/stripe-secret-key'
import { computeFinalPrice } from '@/lib/pricing'
import { flattenVariantItemsGalleryUrls, normalizeVariantsForSave } from '@/lib/product-variants'
import { ensureStripePriceForProduct } from '@/lib/stripe-ensure-product-price'
import type { AdminProduct } from '@/lib/admin/types'

async function normalizeCollectionForProduct(raw: string | null | undefined): Promise<string | null> {
  const allowed = await getAllowedCollectionSlugs()
  return normalizeProductCollectionInput(raw, allowed)
}

export async function runSyncProductGallery(
  sb: SupabaseClient,
  productId: string,
  input: {
    image_urls: string[]
    removed_urls: string[]
    update_stripe_image: boolean
  },
): Promise<{ ok: true; product: AdminProduct } | { ok: false; error: string }> {
  const id = String(productId ?? '').trim()
  if (!id) return { ok: false, error: 'ID de producto inválido' }

  const { data: row, error: fetchErr } = await sb
    .from('products')
    .select('id,collection,stripe_product_id')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!row) return { ok: false, error: 'Producto no encontrado' }

  const removed = [...new Set(input.removed_urls.map((u) => u.trim()).filter(Boolean))]
  if (removed.length > 0) {
    const rm = await removeProductImagesFromSupabaseStorage(sb, removed)
    if (!rm.ok) {
      return { ok: false, error: `No se pudieron borrar las imágenes en Storage: ${rm.error}` }
    }
  }

  const urls = input.image_urls.map((u) => String(u).trim()).filter(Boolean)
  const imageColumn = imageUrlsForDatabaseColumn({
    image_url: urls[0] ?? null,
    image_urls: urls,
  })

  const { error } = await updateProductRow(sb, id, { image_url: imageColumn })
  if (error) return productMutationErrorResult('update', error.message)

  if (input.update_stripe_image) {
    const stripeProductId = String(row.stripe_product_id ?? '').trim()
    const secret = stripeSecretKey()
    if (stripeProductId && secret) {
      try {
        const stripe = new Stripe(secret)
        const primary = imageUrlFirstFromDatabase(imageColumn)
        await stripe.products.update(stripeProductId, {
          images: primary ? [primary] : [],
        })
      } catch (syncError) {
        logAdminSupabaseIssue('STRIPE_SYNC_FAILED', 'Galería actualizada pero falló sync de imagen Stripe.', {
          supabaseMessage: syncError instanceof Error ? syncError.message : String(syncError),
        })
      }
    }
  }

  const product = await fetchAdminProductById(sb, id)
  if (!product) return { ok: false, error: 'Galería guardada pero no se pudo leer el producto' }
  return { ok: true, product }
}

export async function runUpdateProduct(
  sb: SupabaseClient,
  id: string,
  input: AdminProductInput,
): Promise<{ ok: true; product: AdminProduct } | { ok: false; error: string }> {
  const productId = String(id ?? '').trim()
  if (!productId) return { ok: false, error: 'ID de producto inválido' }

  const price = computeFinalPrice(input.original_price, input.discount_percent)
  const collection = await normalizeCollectionForProduct(input.collection)
  const normalizedVariants =
    input.has_variants && input.variants
      ? normalizeVariantsForSave(input.variants)
      : { colors: [], sizes: [], items: [] }
  const hasVariants = Boolean(input.has_variants && normalizedVariants.items.length)
  const variantImages = hasVariants ? flattenVariantItemsGalleryUrls(normalizedVariants.items) : []
  const imageInput =
    hasVariants && variantImages.length
      ? { image_url: variantImages[0], image_urls: variantImages }
      : input
  const writePayload = {
    name: input.name,
    description: input.description,
    category: input.category,
    collection,
    image_url: imageUrlsForDatabaseColumn(imageInput),
    is_new_arrival: input.is_new_arrival,
    in_stock: input.in_stock,
    original_price: input.original_price,
    discount_percent: input.discount_percent,
    price,
    has_variants: hasVariants,
    variants: hasVariants ? normalizedVariants : { colors: [], sizes: [], items: [] },
  }

  const { data, error } = await updateProductRow(sb, productId, writePayload)
  if (error) return productMutationErrorResult('update', error.message)

  const row = (data ?? {}) as Record<string, unknown>
  const secret = stripeSecretKey()
  if (secret) {
    try {
      const stripe = new Stripe(secret)
      await ensureStripePriceForProduct({
        stripe,
        supabase: sb,
        product: {
          id: productId,
          name: input.name.trim(),
          price,
          description: input.description,
          stripe_product_id: (row.stripe_product_id as string) ?? null,
          stripe_price_id: (row.stripe_price_id as string) ?? null,
          image_url: row.image_url,
        },
      })
    } catch (syncError) {
      logAdminSupabaseIssue('STRIPE_SYNC_FAILED', 'Producto actualizado en Supabase pero falló sync Stripe.', {
        supabaseMessage: syncError instanceof Error ? syncError.message : String(syncError),
      })
    }
  }

  const product = await fetchAdminProductById(sb, productId)
  if (!product) return { ok: false, error: 'Producto actualizado pero no se pudo leer de nuevo' }
  return { ok: true, product }
}
