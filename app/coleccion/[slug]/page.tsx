export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductGrid, { type ProductGridProduct } from '@/components/ProductGrid'
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
    .ilike('collection', normalizedSlug)
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

  if (products.length === 0) notFound()

  const title = getCollectionTitle(normalizedSlug)

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="pt-28 lg:pt-32 pb-16 px-4 md:px-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Colección</p>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">{title}</h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">{products.length} piezas</p>
        </div>

        <ProductGrid products={products} />
      </div>

      <Footer />
    </main>
  )
}
