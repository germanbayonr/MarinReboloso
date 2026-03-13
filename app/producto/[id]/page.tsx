import ProductDetailClient from '@/components/ProductDetailClient'

export default function ProductoPage({ params }: { params: { id: string } }) {
  return <ProductDetailClient id={params.id} />
}

