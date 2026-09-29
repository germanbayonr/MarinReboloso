import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchAdminProductById,
  isPostgrestSchemaMismatchError,
  queryAdminProductsForPanel,
} from '@/lib/admin/fetch-admin-products'
import { mapProductRow } from '@/lib/admin/map-product'
import type { AdminProduct } from '@/lib/admin/types'

const PATCH_SELECT_CANDIDATES = [
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,has_variants,variants,description,stripe_price_id,stripe_product_id',
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,description,stripe_price_id,stripe_product_id',
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,created_at,description,stripe_price_id,stripe_product_id',
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,created_at,description',
  'id,name,price,image_url,category,collection,in_stock,created_at',
] as const

export async function patchAdminProductRow(
  sb: SupabaseClient,
  productId: string,
  patch: Record<string, unknown>,
): Promise<{ ok: true; product: AdminProduct } | { ok: false; error: string }> {
  const id = String(productId ?? '').trim()
  if (!id) return { ok: false, error: 'ID de producto inválido' }

  let lastError: string | null = null
  for (const select of PATCH_SELECT_CANDIDATES) {
    const { data, error } = await sb.from('products').update(patch).eq('id', id).select(select).maybeSingle()
    if (!error && data) {
      return { ok: true, product: mapProductRow(data as Record<string, unknown>) }
    }
    if (error) {
      lastError = error.message
      if (!isPostgrestSchemaMismatchError(error.message)) {
        return { ok: false, error: error.message }
      }
    }
  }

  const fallback = await fetchAdminProductById(sb, id)
  if (fallback) return { ok: true, product: fallback }

  return { ok: false, error: lastError ?? 'Producto actualizado pero no se pudo leer de nuevo' }
}

/** Comprueba que la carga del panel no lanza (para páginas RSC). */
export async function safeLoadAdminProductsForPanel(sb: SupabaseClient): Promise<{
  products: AdminProduct[]
  error: string | null
}> {
  try {
    const rows = await queryAdminProductsForPanel(sb)
    return { products: rows.map((row) => mapProductRow(row)), error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo cargar el listado de productos'
    return { products: [], error: message }
  }
}
