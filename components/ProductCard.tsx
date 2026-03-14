'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useProducts } from '@/lib/products-context'

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
  const { getByName } = useProducts()
  const imageUrl = product.image_url ?? ''
  const matched = useMemo(() => getByName(product.name), [getByName, product.name])
  const rawPrice = matched?.price ?? product.price
  const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice)

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
          {Number.isFinite(price) ? price.toFixed(2) : '—'}€
        </p>
      </div>
    </Link>
  )
}
