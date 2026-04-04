import ProductsAdminClient from '@/components/admin/ProductsAdminClient'
import { adminGetProducts } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminProductosPage() {
  const products = await adminGetProducts()
  return <ProductsAdminClient initialProducts={products} />
}
