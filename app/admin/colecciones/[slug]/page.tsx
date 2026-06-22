import Link from 'next/link'
import { notFound } from 'next/navigation'
import { adminGetProducts } from '@/app/admin/actions'
import { fetchAllCollectionsAdmin, fetchCollectionBySlugAdmin, toCollectionOptions } from '@/lib/collections'
import { buildProductCollectionOptions } from '@/lib/admin/product-collections'
import { productMatchesCollectionSlug } from '@/lib/collection-product-match'
import ProductsAdminClient from '@/components/admin/ProductsAdminClient'
import CollectionHeroEditor from '@/components/admin/CollectionHeroEditor'
import CollectionVisibilityEditor from '@/components/admin/CollectionVisibilityEditor'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ColeccionAdminDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const normalized = String(slug ?? '').toLowerCase().trim()
  const allCollections = await fetchAllCollectionsAdmin()
  const collection = await fetchCollectionBySlugAdmin(normalized)
  if (!collection) notFound()

  const allProducts = await adminGetProducts()
  const collectionProducts = sortProductsByCreatedAtDesc(
    allProducts.filter((p) => productMatchesCollectionSlug(p.collection, normalized)),
  )
  const collectionOptions = buildProductCollectionOptions(toCollectionOptions(allCollections))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/admin/colecciones" className="text-muted-foreground underline hover:text-foreground">
          ← Colecciones
        </Link>
        <Link
          href={`/coleccion/${normalized}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground underline hover:text-foreground"
        >
          Ver en tienda
        </Link>
      </div>

      <CollectionVisibilityEditor
        collection={collection}
        maxHomepageOrder={Math.max(...allCollections.map((c) => c.homepage_order), 1)}
      />

      <CollectionHeroEditor key={`${collection.slug}-${collection.homepage_order}`} collection={collection} />

      <ProductsAdminClient
        initialProducts={collectionProducts}
        variant="collection"
        collectionLabel={collection.label}
        collectionSlug={normalized}
        collectionOptions={collectionOptions}
      />
    </div>
  )
}
