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

export default async function CatalogoPage() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('is_new_arrival', { ascending: false })
    .order('name', { ascending: true })
    .limit(5000)

  const products: Array<{
    id: string
    name: string
    price: number
    image_url: string | null
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
        image_url: row.image_url ?? null,
        category: row.category ?? null,
        collection: row.collection ?? null,
        is_new_arrival: Boolean(row.is_new_arrival),
        stock: typeof row.stock === 'number' ? row.stock : null,
        in_stock: typeof row.in_stock === 'boolean' ? row.in_stock : null,
      }))

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <ProductCatalogClient title="Catálogo" products={products} />

      <Footer />
    </main>
  )
}
