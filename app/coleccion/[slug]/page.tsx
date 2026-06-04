export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import NavbarWithCollections from '@/components/NavbarWithCollections'
import Footer from '@/components/Footer'
import CollectionHero from '@/components/CollectionHero'
import CollectionProductsClient from '@/components/CollectionProductsClient'
import { fetchCollectionBySlug } from '@/lib/collections'
import { fetchProductsForCollectionSlug, toCollectionGridProducts } from '@/lib/collection-products'

export default async function ColeccionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalizedSlug = String(slug ?? '').toLowerCase().trim()
  if (!normalizedSlug) notFound()

  const collectionMeta = await fetchCollectionBySlug(normalizedSlug)
  if (!collectionMeta) notFound()

  const title = collectionMeta.label
  const { products: rows, error } = await fetchProductsForCollectionSlug(normalizedSlug)
  const products = toCollectionGridProducts(rows)

  if (error) {
    console.error('[coleccion] Error cargando productos:', normalizedSlug, error)
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
        <CollectionProductsClient products={products} />
      </div>

      <Footer />
    </main>
  )
}
