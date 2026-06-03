import Link from 'next/link'
import { adminGetProducts } from '@/app/admin/actions'
import CreateCollectionClient from '@/components/admin/CreateCollectionClient'
import { getNextHomepageOrder } from '@/lib/collections'

export const dynamic = 'force-dynamic'

export default async function NuevaColeccionPage() {
  const [products, defaultHomepageOrder] = await Promise.all([adminGetProducts(), getNextHomepageOrder()])
  return (
    <div className="space-y-4">
      <CreateCollectionClient allProducts={products} defaultHomepageOrder={defaultHomepageOrder} />
    </div>
  )
}
