export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductGrid, { type ProductGridProduct } from '@/components/ProductGrid'
import CollectionHero from '@/components/CollectionHero'
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

      <CollectionHero slug={normalizedSlug} title={title} />

      <div className="py-14 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="font-sans text-sm text-muted-foreground">{products.length} piezas</p>
        </div>
        <ProductGrid products={products} />
      </div>

      <Footer />
    </main>
  )
}
