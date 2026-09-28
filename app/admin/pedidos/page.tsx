import OrdersAdminClient from '@/components/admin/OrdersAdminClient'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import { loadAdminOrdersForPanel } from '@/lib/admin/load-admin-orders'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPedidosPage() {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const orders = await loadAdminOrdersForPanel(sb)
  return <OrdersAdminClient initialOrders={orders} />
}
