import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { adminGetProducts } from '@/app/admin/actions'
import { fetchAllCollectionsAdmin } from '@/lib/collections'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ColeccionesPage() {
  const [products, collections] = await Promise.all([adminGetProducts(), fetchAllCollectionsAdmin()])

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl tracking-wide">Colecciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{rows.length} colecciones</p>
        </div>
        <Link
          href="/admin/colecciones/nueva"
          className="inline-flex items-center gap-2 bg-neutral-900 px-4 py-2.5 text-xs uppercase tracking-wider text-white hover:bg-neutral-800"
        >
          <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
          Nueva colección
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((col) => (
          <div key={col.slug} className="bg-white border border-border p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-serif text-base">{col.label}</h2>
              <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 shrink-0">
                Portada #{col.homepage_order}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {col.visible_on_homepage ? (
                <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5">En portada</span>
              ) : (
                <span className="text-[10px] bg-neutral-50 text-neutral-500 px-2 py-0.5">Sin portada</span>
              )}
              {col.visible_on_site ? (
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5">Web visible</span>
              ) : (
                <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5">Web oculta</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">/{col.slug}</p>
              <p className="text-sm">{col.productsCount} productos</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/colecciones/${col.slug}`}
                className="text-xs underline text-foreground hover:opacity-70"
              >
                Gestionar
              </Link>
              {col.visible_on_site ? (
                <Link
                  href={`/coleccion/${col.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-muted-foreground hover:text-foreground"
                >
                  Ver en tienda
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
