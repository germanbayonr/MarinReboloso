export const dynamic = 'force-dynamic'
export const revalidate = 0

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCatalogClient from '@/components/ProductCatalogClient'
import { fetchActiveProducts } from '@/lib/products-data-source'
import { filterProductsByCollectionVisibility } from '@/lib/product-collection-visibility'

function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export default async function CatalogoPage() {
  const { products, error } = await fetchActiveProducts()

  if (error) {
    console.error('[catalogo] Error cargando productos:', error)
  }

  const rawProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: toNumber(p.price),
    image_url: p.image_urls?.length ? p.image_urls : p.image_url,
    category: p.category,
    collection: p.collection,
    is_new_arrival: Boolean(p.is_new_arrival),
    in_stock: p.in_stock,
  }))

  const visibleProducts = await filterProductsByCollectionVisibility(rawProducts)

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <ProductCatalogClient title="Catálogo" products={visibleProducts} />

      <Footer />
    </main>
  )
}
