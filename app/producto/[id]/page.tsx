export const dynamic = 'force-dynamic'
export const revalidate = 0

import ProductDetailClient from '@/components/ProductDetailClient'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseServerClient()
  
  // Intentar buscar por UUID primero, si falla o no es un UUID válido, intentar por nombre/slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  
  let query = supabase.from('products').select('*')
  
  if (isUUID) {
    query = query.eq('id', id)
  } else {
    // Si no es UUID, buscamos por el campo name (normalizado) o slug si existiera
    // Como no hay columna slug, usamos ilike con el name
    query = query.ilike('name', id.replace(/-/g, ' '))
  }

  const { data: product, error } = await query.single()

  if (error || !product) {
    return <div>Error: Producto no encontrado. ID: {id}</div>
  }

  return <ProductDetailClient product={product as any} />
}
