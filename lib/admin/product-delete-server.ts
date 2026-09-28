import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { allImageUrlsFromDatabase } from '@/lib/admin/product-image-db'
import { archiveStripeProduct } from '@/lib/admin/archive-stripe-product'
import { removeProductImagesFromSupabaseStorage } from '@/lib/admin/remove-product-storage-images'
import { productMutationErrorResult } from '@/lib/admin/product-mutation-errors'
import { stripeSecretKey } from '@/lib/admin/stripe-secret-key'

type ProductDeleteRow = {
  id: string
  name?: string | null
  image_url?: unknown
  stripe_product_id?: string | null
}

async function deleteOneProductFromStores(
  sb: SupabaseClient,
  stripe: Stripe | null,
  row: ProductDeleteRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const stripeProductId = row.stripe_product_id?.trim() ?? ''
  if (stripeProductId) {
    if (!stripe) {
      return { ok: false, error: 'Falta STRIPE_SECRET_KEY para eliminar el producto en Stripe.' }
    }
    const archived = await archiveStripeProduct(stripe, stripeProductId)
    if (!archived.ok) return { ok: false, error: `No se pudo desactivar en Stripe: ${archived.error}` }
  }

  const imageUrls = allImageUrlsFromDatabase(row.image_url)
  if (imageUrls.length > 0) {
    const rm = await removeProductImagesFromSupabaseStorage(sb, imageUrls)
    if (!rm.ok) {
      return { ok: false, error: `No se pudieron borrar las imágenes en Storage: ${rm.error}` }
    }
  }

  const { error } = await sb.from('products').delete().eq('id', row.id)
  if (error) return productMutationErrorResult('delete', error.message)
  return { ok: true }
}

export async function runAdminDeleteProduct(
  sb: SupabaseClient,
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const productId = String(id ?? '').trim()
  if (!productId) return { ok: false, error: 'ID de producto inválido' }

  const { data: row, error: fetchErr } = await sb
    .from('products')
    .select('id, name, image_url, stripe_product_id')
    .eq('id', productId)
    .maybeSingle()
  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!row) return { ok: false, error: 'Producto no encontrado' }

  const secret = stripeSecretKey()
  const stripe = secret ? new Stripe(secret) : null
  return deleteOneProductFromStores(sb, stripe, row as ProductDeleteRow)
}

export async function runAdminDeleteProducts(
  sb: SupabaseClient,
  ids: string[],
): Promise<
  | { ok: true; deletedCount: number; failures: Array<{ id: string; name?: string; error: string }> }
  | { ok: false; error: string }
> {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) return { ok: false, error: 'No hay productos seleccionados' }

  const { data: rows, error: fetchErr } = await sb
    .from('products')
    .select('id, name, image_url, stripe_product_id')
    .in('id', uniqueIds)
  if (fetchErr) return { ok: false, error: fetchErr.message }

  const secret = stripeSecretKey()
  const stripe = secret ? new Stripe(secret) : null
  const failures: Array<{ id: string; name?: string; error: string }> = []
  let deletedCount = 0

  const foundIds = new Set<string>()
  for (const row of (rows ?? []) as ProductDeleteRow[]) {
    foundIds.add(row.id)
    const deleted = await deleteOneProductFromStores(sb, stripe, row)
    if (!deleted.ok) {
      failures.push({ id: row.id, name: row.name ?? undefined, error: deleted.error })
      continue
    }
    deletedCount++
  }

  for (const id of uniqueIds) {
    if (!foundIds.has(id)) failures.push({ id, error: 'Producto no encontrado' })
  }

  return { ok: true, deletedCount, failures }
}
