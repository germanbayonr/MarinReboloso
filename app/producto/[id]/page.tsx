export const dynamic = 'force-dynamic'
export const revalidate = 0

import ProductDetailClient from '@/components/ProductDetailClient'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseServerClient()
  const { data: product, error } = await supabase.from('products').select('*').eq('id', id).single()

  if (error || !product) {
    return <div>Error: Producto no encontrado. ID: {id}</div>
  }

  return <ProductDetailClient product={product as any} />
}
