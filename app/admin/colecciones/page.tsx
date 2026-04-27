import Link from 'next/link'
import { adminGetProducts } from '@/app/admin/actions'
import { WEB_COLLECTIONS } from '@/lib/web-collections'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ColeccionesPage() {
  const products = await adminGetProducts()
  const collections = WEB_COLLECTIONS.map((collection) => {
    const productsCount = products.filter((product) => {
      const slug = (product.collection ?? '').trim().toLowerCase()
      if (collection.slug === 'jaipur') return slug === 'jaipur' || slug === 'lost-in-jaipur'
      return slug === collection.slug
    }).length
    return {
      slug: collection.slug,
      name: collection.label,
      products: productsCount,
      status: 'activa',
      season: 'Colección web',
    }
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl tracking-wide">Colecciones</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{collections.length} colecciones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {collections.map((col) => (
          <div key={col.slug} className="bg-white border border-border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <h2 className="font-serif text-base">{col.name}</h2>
              <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5">{col.status}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{col.season}</p>
              <p className="text-sm">{col.products} productos</p>
            </div>
            <Link
              href={`/coleccion/${col.slug}`}
              suppressHydrationWarning
              className="inline-flex text-xs underline text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver productos
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
