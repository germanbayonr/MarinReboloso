export const dynamic = 'force-dynamic'
export const revalidate = 0

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductGrid, { type ProductGridProduct } from '@/components/ProductGrid'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export default async function CatalogoPage() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('is_new_arrival', { ascending: false })
    .order('name', { ascending: true })
    .limit(5000)

  const products: ProductGridProduct[] = error
    ? []
    : (data ?? []).map((row: any) => ({
        id: String(row.id),
        name: String(row.name ?? ''),
        price: toNumber(row.price),
        image_url: row.image_url ?? null,
        category: row.category ?? null,
        collection: row.collection ?? null,
      }))

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="pt-28 lg:pt-32 pb-16 px-4 md:px-10 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Catálogo</h1>
            <p className="font-sans text-sm text-muted-foreground mt-1">{products.length} piezas</p>
          </div>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="py-20 text-center">
            <p className="font-serif text-xl text-muted-foreground">No hay piezas disponibles</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
