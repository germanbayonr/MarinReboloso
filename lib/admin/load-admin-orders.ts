import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminOrder } from '@/lib/admin/types'

/** Misma lectura que `/admin/pedidos` y el dashboard (sin importar `app/admin/actions`). */
export async function loadAdminOrdersForPanel(sb: SupabaseClient): Promise<AdminOrder[]> {
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(5000)
  if (error) throw new Error(error.message)
  return (data ?? []) as AdminOrder[]
}
