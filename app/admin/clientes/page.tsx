import ClientesAdminClient from '@/components/admin/ClientesAdminClient'
import { adminGetCustomers } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminClientesPage() {
  const rows = await adminGetCustomers()
  return <ClientesAdminClient initialRows={rows} />
}
