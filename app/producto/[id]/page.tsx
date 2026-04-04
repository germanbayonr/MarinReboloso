export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/ProductDetailClient'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseServerClient()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

  let query = supabase.from('products').select('*').eq('is_active', true)

  if (isUUID) {
    query = query.eq('id', id)
  } else {
    query = query.ilike('name', id.replace(/-/g, ' '))
  }

  const { data: product, error } = await query.maybeSingle()

  if (error || !product) {
    notFound()
  }

  return <ProductDetailClient product={product as any} />
}
