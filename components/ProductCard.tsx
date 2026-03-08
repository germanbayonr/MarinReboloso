'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface ProductCardProduct {
  id: string
  name: string
  price: number
  images: string[]
  category: string
  status: string
}

export default function ProductCard({ product }: { product: ProductCardProduct }) {
  const [imgIndex, setImgIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIndex(i => (i - 1 + product.images.length) % product.images.length)
  }

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIndex(i => (i + 1) % product.images.length)
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block"
      suppressHydrationWarning
    >
      <div
        className="relative overflow-hidden bg-secondary/20 aspect-[3/4]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setImgIndex(0) }}
      >
        <Image
          src={product.images[imgIndex] || '/images/placeholder.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />

        {product.status === 'draft' && (
          <span className="absolute top-2 left-2 bg-background/90 text-foreground text-[9px] tracking-widest uppercase px-1.5 py-0.5">
            Agotado
          </span>
        )}

        {hovered && product.images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white/85 hover:bg-white transition-colors shadow-sm"
              aria-label="Imagen anterior"
              suppressHydrationWarning
            >
              <ChevronLeft className="h-3.5 w-3.5 text-foreground" strokeWidth={2} />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white/85 hover:bg-white transition-colors shadow-sm"
              aria-label="Imagen siguiente"
              suppressHydrationWarning
            >
              <ChevronRight className="h-3.5 w-3.5 text-foreground" strokeWidth={2} />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" suppressHydrationWarning>
              {product.images.map((_, i) => (
                <span
                  key={i}
                  className={`block w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pt-3 space-y-0.5">
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-muted-foreground">{product.category}</p>
        <p className="font-serif text-sm leading-snug">{product.name}</p>
        <p className="font-sans text-sm text-foreground/80">{product.price} €</p>
      </div>
    </Link>
  )
}
