import CollectionsAdminClient from '@/components/admin/CollectionsAdminClient'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import { loadAdminProductsForPanel } from '@/lib/admin/load-admin-products'
import { fetchAllCollectionsAdmin } from '@/lib/collections'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ColeccionesPage() {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const [products, collections] = await Promise.all([
    loadAdminProductsForPanel(sb),
    fetchAllCollectionsAdmin(),
  ])

  const rows = [...collections]
    .sort((a, b) => a.homepage_order - b.homepage_order)
    .map((collection) => {
      const slugs =
        collection.slug === 'jaipur' ? ['jaipur', 'lost-in-jaipur'] : [collection.slug]
      const productsCount = products.filter((product) => {
        const slug = (product.collection ?? '').trim().toLowerCase()
        return slugs.includes(slug)
      }).length
      return {
        ...collection,
        productsCount,
      }
    })

  return <CollectionsAdminClient rows={rows} />
}
