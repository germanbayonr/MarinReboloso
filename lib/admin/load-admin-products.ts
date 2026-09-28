import type { SupabaseClient } from '@supabase/supabase-js'
import { queryAdminProductsForPanel } from '@/lib/admin/fetch-admin-products'
import { mapProductRow } from '@/lib/admin/map-product'
import type { AdminProduct } from '@/lib/admin/types'

/** Misma carga que `/admin/productos` (sin redirect de server actions). */
export async function loadAdminProductsForPanel(sb: SupabaseClient): Promise<AdminProduct[]> {
  const rows = await queryAdminProductsForPanel(sb)
  return rows.map((row) => mapProductRow(row))
}
