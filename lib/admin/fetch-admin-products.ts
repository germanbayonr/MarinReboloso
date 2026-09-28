import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ADMIN_PRODUCT_SELECT,
  ADMIN_PRODUCT_SELECT_LEGACY,
  isMissingVariantsColumnError,
} from '@/lib/admin/product-db-schema'
import { logAdminSupabaseIssue } from '@/lib/admin/supabase-admin-log'

/** PostgREST cuando falta una columna o el schema cache no la conoce. */
export function isPostgrestSchemaMismatchError(message: string | null | undefined): boolean {
  if (!message) return false
  if (isMissingVariantsColumnError(message)) return true
  const m = message.toLowerCase()
  return (
    m.includes('does not exist') ||
    m.includes('could not find') ||
    m.includes('schema cache') ||
    (m.includes('column') && m.includes('products'))
  )
}

/** De más completo a más compatible con BD antigua. */
const ADMIN_PRODUCT_SELECT_CANDIDATES = [
  ADMIN_PRODUCT_SELECT,
  ADMIN_PRODUCT_SELECT_LEGACY,
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,is_active,created_at,description,stripe_price_id,stripe_product_id',
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,created_at,description,stripe_price_id,stripe_product_id',
  'id,name,price,original_price,discount_percent,image_url,category,collection,is_new_arrival,in_stock,created_at,description',
  'id,name,price,image_url,category,collection,in_stock,created_at',
] as const

export async function queryAdminProductsForPanel(sb: SupabaseClient): Promise<Record<string, unknown>[]> {
  let lastError: string | null = null

  for (let i = 0; i < ADMIN_PRODUCT_SELECT_CANDIDATES.length; i++) {
    const select = ADMIN_PRODUCT_SELECT_CANDIDATES[i]
    const { data, error } = await sb
      .from('products')
      .select(select)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(5000)

    if (!error) {
      if (i > 0) {
        logAdminSupabaseIssue('ADMIN_PRODUCTS_LEGACY_SELECT', 'Consulta admin products con select reducido.', {
          selectIndex: String(i),
          select,
        })
      }
      return (data ?? []) as Record<string, unknown>[]
    }

    lastError = error.message
    if (!isPostgrestSchemaMismatchError(error.message)) {
      throw new Error(error.message)
    }
  }

  throw new Error(lastError ?? 'No se pudo leer products con ningún select compatible.')
}
