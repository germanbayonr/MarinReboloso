import ProductsAdminClient from '@/components/admin/ProductsAdminClient'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import { safeLoadAdminProductsForPanel } from '@/lib/admin/patch-admin-product'
import { fetchAllCollectionsAdmin, toCollectionOptions } from '@/lib/collections'
import { buildProductCollectionOptions } from '@/lib/admin/product-collections'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminProductosPage() {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const [{ products, error: productsError }, collections] = await Promise.all([
    safeLoadAdminProductsForPanel(sb),
    fetchAllCollectionsAdmin(),
  ])
  const collectionOptions = buildProductCollectionOptions(toCollectionOptions(collections))

  if (productsError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-900">
        <p className="font-medium">No se pudo cargar la lista de productos</p>
        <p className="mt-2 text-red-800">{productsError}</p>
        <p className="mt-3 text-xs text-red-700">
          Revisa{' '}
          <a href="/api/admin/health" className="underline">
            /api/admin/health
          </a>{' '}
          o recarga la página.
        </p>
      </div>
    )
  }

  return <ProductsAdminClient initialProducts={products} collectionOptions={collectionOptions} />
}
