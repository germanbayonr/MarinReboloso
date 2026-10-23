export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import NavbarWithCollections from '@/components/NavbarWithCollections'
import Footer from '@/components/Footer'
import CollectionHero from '@/components/CollectionHero'
import CollectionProductsClient from '@/components/CollectionProductsClient'
import { fetchCollectionBySlugAdmin } from '@/lib/collections'
import { fetchProductsForCollectionSlug, toCollectionGridProducts } from '@/lib/collection-products'

export default async function ColeccionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalizedSlug = String(slug ?? '').toLowerCase().trim()
  if (!normalizedSlug) notFound()

  const collectionMeta = await fetchCollectionBySlugAdmin(normalizedSlug)
  if (!collectionMeta) notFound()

  const title = collectionMeta.label
  const { storefrontProducts, error, fromFallback } = await fetchProductsForCollectionSlug(normalizedSlug)
  const products = toCollectionGridProducts(storefrontProducts)

  if (error) {
    console.error('[coleccion] Error cargando productos:', normalizedSlug, error)
  }
  if (fromFallback) {
    console.warn('[coleccion] Mostrando catálogo maestro local para', normalizedSlug)
  }

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <NavbarWithCollections />

      <CollectionHero
        slug={normalizedSlug}
        title={title}
        heroImageLeft={collectionMeta.hero_image_left}
        heroImageRight={collectionMeta.hero_image_right}
      />

      <div className="py-14 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error ? (
          <p className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            No se pudieron cargar los productos de esta colección. {error}
          </p>
        ) : null}
        {fromFallback ? (
          <p className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Catálogo temporal sin conexión a la base de datos. Los precios de 25€ no son los precios reales de la tienda.
          </p>
        ) : null}
        <CollectionProductsClient products={products} />
      </div>

      <Footer />
    </main>
  )
}
