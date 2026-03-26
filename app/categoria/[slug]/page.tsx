export const dynamic = 'force-dynamic'
export const revalidate = 0

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCatalogClient from '@/components/ProductCatalogClient'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function titleize(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('category', slug)
    .order('is_new_arrival', { ascending: false })
    .order('name', { ascending: true })
    .limit(5000)

  const products: Array<{
    id: string
    name: string
    price: number
    image_url: string[]
    category: string | null
    collection: string | null
    is_new_arrival: boolean
    stock?: number | null
    in_stock?: boolean | null
  }> = error
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

  const title = titleize(String(slug ?? ''))

  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-background flex flex-col" suppressHydrationWarning>
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-6 py-32">
          <div className="max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="space-y-4">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground/90 leading-tight">
                {title}
              </h1>
              <div className="h-px w-24 bg-foreground/20 mx-auto" />
            </div>
            <p className="font-sans text-lg md:text-xl text-muted-foreground leading-relaxed tracking-wide font-light italic px-4">
              "Nuestras piezas de {title} están siendo seleccionadas con mimo. Estarán disponibles para ti muy pronto."
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

      <ProductCatalogClient title={title} products={products} />

      <Footer />
    </main>
  )
}
