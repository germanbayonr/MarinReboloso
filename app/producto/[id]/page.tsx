import ProductDetailClient from '@/components/ProductDetailClient'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const revalidate = 3600

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseServerClient()
  const { data: product, error } = await supabase.from('products').select('*').eq('id', id).single()

  if (error || !product) {
    return <div>Error: Producto no encontrado. ID: {id}</div>
  }

  return <ProductDetailClient product={product as any} />
}
