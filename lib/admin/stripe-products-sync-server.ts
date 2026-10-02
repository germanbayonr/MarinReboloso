import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { imageUrlFirstFromDatabase } from '@/lib/admin/product-image-db'
import { stripeSecretKey } from '@/lib/admin/stripe-secret-key'
import { ensureStripePriceForProduct } from '@/lib/stripe-ensure-product-price'

export interface StripeSyncFailedItem {
  name: string
  reason: string
}

function normalizeNullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function primaryImageFromRow(imageUrl: unknown): string | null {
  return imageUrlFirstFromDatabase(imageUrl)
}

export async function runSyncProductsWithStripe(sb: SupabaseClient): Promise<{
  success: boolean
  syncedCount: number
  failedSyncs: StripeSyncFailedItem[]
}> {
  const secret = stripeSecretKey()
  if (!secret) {
    return {
      success: false,
      syncedCount: 0,
      failedSyncs: [{ name: 'Sistema', reason: 'Falta STRIPE_SECRET_KEY para sincronizar productos.' }],
    }
  }

  const stripe = new Stripe(secret)
  const failedSyncs: StripeSyncFailedItem[] = []
  let syncedCount = 0

  const { data: unsyncedProducts, error: unsyncedProductsError } = await sb
    .from('products')
    .select('id,name,description,image_url,price,stripe_product_id,stripe_price_id')
    .or('stripe_product_id.is.null,stripe_price_id.is.null')
    .order('name', { ascending: true })

  if (unsyncedProductsError) {
    return {
      success: false,
      syncedCount: 0,
      failedSyncs: [{ name: 'Sistema', reason: unsyncedProductsError.message }],
    }
  }

  for (const product of unsyncedProducts ?? []) {
    const productName = typeof product.name === 'string' ? product.name.trim() : ''
    if (!productName) {
      failedSyncs.push({ name: '(sin nombre)', reason: 'Nombre vacío en Supabase.' })
      continue
    }

    try {
      const amountEur = Number(product.price)
      const description = normalizeNullableText(product.description)

      const ensuredPriceId = await ensureStripePriceForProduct({
        stripe,
        supabase: sb,
        product: {
          id: String(product.id),
          name: productName,
          price: amountEur,
          description,
          stripe_product_id: (product.stripe_product_id as string) ?? null,
          stripe_price_id: (product.stripe_price_id as string) ?? null,
          image_url: product.image_url,
        },
      })

      if (!ensuredPriceId) throw new Error('No se pudo crear/enlazar precio en Stripe.')

      syncedCount += 1
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error de API'
      failedSyncs.push({ name: productName, reason })
    }
  }

  const { data: linkedProducts, error: linkedProductsError } = await sb
    .from('products')
    .select('id,name,price,description,image_url,stripe_product_id,stripe_price_id')
    .not('stripe_product_id', 'is', null)
    .not('stripe_price_id', 'is', null)

  if (linkedProductsError) {
    failedSyncs.push({
      name: 'Sistema',
      reason: `No se pudo validar precios puntuales en productos ya enlazados: ${linkedProductsError.message}`,
    })
  } else {
    for (const linkedProduct of linkedProducts ?? []) {
      try {
        const productName = String(linkedProduct.name ?? '').trim() || '(sin nombre)'
        const amountEur = Number(linkedProduct.price)
        const stripeProductId = String(linkedProduct.stripe_product_id ?? '').trim()
        const stripePriceId = String(linkedProduct.stripe_price_id ?? '').trim()
        if (!stripeProductId || !stripePriceId) continue

        const currentSupabaseDescription = normalizeNullableText(linkedProduct.description)
        const stripeProduct = await stripe.products.retrieve(stripeProductId)
        const stripeDescription = normalizeNullableText(stripeProduct.description)

        const ensuredPriceId = await ensureStripePriceForProduct({
          stripe,
          supabase: sb,
          product: {
            id: String(linkedProduct.id),
            name: productName,
            price: amountEur,
            description: currentSupabaseDescription,
            stripe_product_id: stripeProductId,
            stripe_price_id: stripePriceId,
            image_url: (linkedProduct as { image_url?: unknown }).image_url,
          },
        })

        if (!ensuredPriceId) continue

        const shouldUpdateDescription = !currentSupabaseDescription && !!stripeDescription
        const shouldUpdatePriceId = ensuredPriceId !== stripePriceId
        if (!shouldUpdateDescription && !shouldUpdatePriceId) continue

        const { error: updateLinkedError } = await sb
          .from('products')
          .update({
            stripe_price_id: ensuredPriceId,
            description: shouldUpdateDescription ? stripeDescription : currentSupabaseDescription,
          })
          .eq('id', String(linkedProduct.id))

        if (updateLinkedError) throw new Error(updateLinkedError.message)
        syncedCount += 1
      } catch (error) {
        const productName = String(linkedProduct.name ?? '(sin nombre)').trim() || '(sin nombre)'
        const reason =
          error instanceof Error
            ? `No se pudo sincronizar precio Stripe: ${error.message}`
            : 'No se pudo sincronizar precio Stripe'
        failedSyncs.push({ name: productName, reason })
      }
    }
  }

  return {
    success: failedSyncs.length === 0,
    syncedCount,
    failedSyncs,
  }
}

/** Imagen principal absoluta para Stripe (URLs relativas no válidas). */
export function stripeImageUrlFromProductRow(imageUrl: unknown): string | null {
  const first = primaryImageFromRow(imageUrl)
  if (!first) return null
  if (/^https?:\/\//i.test(first)) return first
  return null
}
