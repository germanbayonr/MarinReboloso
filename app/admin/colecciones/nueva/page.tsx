import Link from 'next/link'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import { loadAdminProductsForPanel } from '@/lib/admin/load-admin-products'
import CreateCollectionClient from '@/components/admin/CreateCollectionClient'
import { getNextHomepageOrder } from '@/lib/collections'

export const dynamic = 'force-dynamic'

export default async function NuevaColeccionPage() {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const [products, defaultHomepageOrder] = await Promise.all([
    loadAdminProductsForPanel(sb),
    getNextHomepageOrder(),
  ])
  return (
    <div className="space-y-4">
      <CreateCollectionClient allProducts={products} defaultHomepageOrder={defaultHomepageOrder} />
    </div>
  )
}
