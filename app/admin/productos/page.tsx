import ProductsAdminClient from '@/components/admin/ProductsAdminClient'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import { loadAdminProductsForPanel } from '@/lib/admin/load-admin-products'
import { fetchAllCollectionsAdmin, toCollectionOptions } from '@/lib/collections'
import { buildProductCollectionOptions } from '@/lib/admin/product-collections'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminProductosPage() {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const [products, collections] = await Promise.all([
    loadAdminProductsForPanel(sb),
    fetchAllCollectionsAdmin(),
  ])
  const collectionOptions = buildProductCollectionOptions(toCollectionOptions(collections))
  return <ProductsAdminClient initialProducts={products} collectionOptions={collectionOptions} />
}
