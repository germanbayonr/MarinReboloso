/** Detecta PostgREST cuando la migración de variantes no está aplicada en Supabase remoto. */
export function isMissingVariantsColumnError(message: string | null | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return m.includes('has_variants') || m.includes("'variants'") || m.includes('variants column')
}

export const ADMIN_PRODUCT_SELECT =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,has_variants,variants,description,stripe_price_id,stripe_product_id'

export const ADMIN_PRODUCT_SELECT_LEGACY =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,description,stripe_price_id,stripe_product_id'

export const ADMIN_PRODUCT_SELECT_LITE =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,has_variants,variants'

export const ADMIN_PRODUCT_SELECT_LITE_LEGACY =
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at'

export function stripVariantFields<T extends Record<string, unknown>>(payload: T): Omit<T, 'has_variants' | 'variants'> {
  const { has_variants: _hv, variants: _v, ...rest } = payload
  return rest
}
