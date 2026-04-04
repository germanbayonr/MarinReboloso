import ProductCard from '@/components/ProductCard'

export type ProductGridProduct = {
  id: string
  name: string
  price: number | string
  original_price?: number | string | null
  discount_percent?: number | string | null
  in_stock?: boolean | null
  image_url: string[] | string | null
  category?: string | null
  collection?: string | null
}

export default function ProductGrid({ products }: { products: ProductGridProduct[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
