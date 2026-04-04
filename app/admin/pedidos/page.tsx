import OrdersAdminClient from '@/components/admin/OrdersAdminClient'
import { adminGetOrders } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPedidosPage() {
  const orders = await adminGetOrders()
  return <OrdersAdminClient initialOrders={orders} />
}
