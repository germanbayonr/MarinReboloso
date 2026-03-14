'use client'

import Image from 'next/image'
import Link from 'next/link'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number | string
    image_url: string | null
    category?: string | null
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.image_url ?? ''
  const price = typeof product.price === 'number' ? product.price : Number(product.price)
  const formattedPrice = Number.isFinite(price) ? (Number.isInteger(price) ? String(price) : price.toFixed(2)) : '—'

  return (
    <Link href={`/producto/${product.id}`} className="group block" suppressHydrationWarning>
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="space-y-1">
        <h3 className="font-serif text-lg text-foreground group-hover:text-foreground/60 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground tracking-wide">
          {formattedPrice}€
        </p>
      </div>
    </Link>
  )
}
