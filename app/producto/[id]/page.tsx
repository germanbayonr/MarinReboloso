import ProductDetailClient from '@/components/ProductDetailClient'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { SupabaseProduct } from '@/components/ProductDetailClient'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function getProductByParam(param: string) {
  const supabase = createSupabaseServerClient()

  if (isUuid(param)) {
    const { data } = await supabase
      .from('products')
      .select('id,name,description,price,image_url,category,stripe_product_id,stripe_price_id')
      .eq('id', param)
      .maybeSingle()
    return (data as SupabaseProduct | null) ?? null
  }

  const { data: candidates } = await supabase.from('products').select('id,name')
  const match = (candidates ?? []).find((p) => slugify(String((p as any).name ?? '')) === param)
  if (!match) return null

  const { data } = await supabase
    .from('products')
    .select('id,name,description,price,image_url,category,stripe_product_id,stripe_price_id')
    .eq('id', String((match as any).id))
    .maybeSingle()
  return (data as SupabaseProduct | null) ?? null
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductByParam(id)
  return <ProductDetailClient product={product} />
}
