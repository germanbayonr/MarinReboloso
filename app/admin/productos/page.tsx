import ProductsAdminClient from '@/components/admin/ProductsAdminClient'
import { adminGetProducts } from '@/app/admin/actions'
import { fetchAllCollectionsAdmin, toCollectionOptions } from '@/lib/collections'
import { buildProductCollectionOptions } from '@/lib/admin/product-collections'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminProductosPage() {
  const [products, collections] = await Promise.all([adminGetProducts(), fetchAllCollectionsAdmin()])
  const collectionOptions = buildProductCollectionOptions(toCollectionOptions(collections))
  return <ProductsAdminClient initialProducts={products} collectionOptions={collectionOptions} />
}
