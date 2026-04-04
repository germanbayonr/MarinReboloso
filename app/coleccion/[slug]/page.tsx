export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductGrid, { type ProductGridProduct } from '@/components/ProductGrid'
import CollectionHero from '@/components/CollectionHero'
import CollectionProductsClient from '@/components/CollectionProductsClient'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function getCollectionTitle(slug: string) {
  const normalized = slug.toLowerCase()
  const map: Record<string, string> = {
    corales: 'Corales',
    descara: 'Descará',
    filipa: 'Filipa',
    marebo: 'Marebo',
  }
  return map[normalized] ?? normalized
}

export default async function ColeccionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalizedSlug = String(slug ?? '').toLowerCase().trim()
  if (!normalizedSlug) notFound()

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .ilike('collection', normalizedSlug)
    .order('name', { ascending: true })
    .limit(5000)

  const products: Array<
    ProductGridProduct & { is_new_arrival?: boolean | null; stock?: number | null; in_stock?: boolean | null }
  > = error
    ? []
    : (data ?? []).map((row: any) => ({
        id: String(row.id),
        name: String(row.name ?? ''),
        price: toNumber(row.price),
        image_url: Array.isArray(row.image_url) ? row.image_url : (row.image_url ? [row.image_url] : []),
        category: row.category ?? null,
        collection: row.collection ?? null,
        is_new_arrival: Boolean(row.is_new_arrival),
        stock: typeof row.stock === 'number' ? row.stock : null,
        in_stock: typeof row.in_stock === 'boolean' ? row.in_stock : null,
      }))

  const title = getCollectionTitle(normalizedSlug)

  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-background flex flex-col" suppressHydrationWarning>
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-6 py-32">
          <div className="max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="space-y-4">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground/90 leading-tight">
                Colección {title}
              </h1>
              <div className="h-px w-24 bg-foreground/20 mx-auto" />
            </div>
            <p className="font-sans text-lg md:text-xl text-muted-foreground leading-relaxed tracking-wide font-light italic px-4">
              "Nuestras piezas de la Colección {title} están siendo seleccionadas con mimo. Estarán disponibles para ti muy pronto."
            </p>
            <div className="pt-6">
              <a
                href="/catalogo"
                className="inline-block border border-foreground/30 px-12 py-4 text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-500 ease-out"
              >
                Explorar el catálogo
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <CollectionHero slug={normalizedSlug} title={title} />

      <div className="py-14 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CollectionProductsClient products={products} />
      </div>

      <Footer />
    </main>
  )
}
