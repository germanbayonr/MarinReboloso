'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface InteractiveCardProps {
  product: {
    id: string
    name: string
    description?: string
    price: number
    priceRange?: { min: number; max: number }
    images?: string[]
    variants?: { images: string[] }[]
    collection?: string
    status?: string
    stock?: number
  }
  href?: string
}

export function InteractiveCard({ product, href }: InteractiveCardProps) {
  const [imgIndex, setImgIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const images = product.images?.length ? product.images : (product.variants?.[0]?.images ?? [])
  const resolvedHref = href ?? `/producto/${product.id}`

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIndex(i => (i === 0 ? images.length - 1 : i - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIndex(i => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Image Container */}
      <div 
        className="relative group aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false)
          setImgIndex(0)
        }}
        suppressHydrationWarning
      >
        {/* Image Link - entire container is clickable for navigation to product page */}
        <Link 
          href={resolvedHref}
          className="absolute inset-0 z-0"
          suppressHydrationWarning
        >
          <Image unoptimized
            src={images[imgIndex] ?? images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            suppressHydrationWarning
          />
        </Link>

        {/* Navigation Arrows - only visible on hover, above link */}
        {hovered && images.length > 1 && (
          <>
            {/* Previous Arrow */}
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-black p-2 rounded-full transition-all opacity-100 pointer-events-auto"
              aria-label="Previous image"
              suppressHydrationWarning
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            </button>

            {/* Next Arrow */}
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-black p-2 rounded-full transition-all opacity-100 pointer-events-auto"
              aria-label="Next image"
              suppressHydrationWarning
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 pointer-events-none">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === imgIndex ? 'bg-white w-3' : 'bg-white/50'
                  }`}
                  suppressHydrationWarning
                />
              ))}
            </div>
          </>
        )}

        {/* Stock Badge */}
        {product.status === 'published' && product.stock !== undefined && product.stock < 5 && product.stock > 0 && (
          <div className="absolute top-3 right-3 z-10 bg-white text-black px-2 py-1 text-[10px] font-semibold tracking-wider">
            ¡ÚLTIMAS UNIDADES!
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-1">
        {product.collection && (
          <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            {product.collection}
          </p>
        )}
        <h3 className="font-serif text-lg tracking-tight line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {product.priceRange ? (
            <>
              {product.priceRange.min.toFixed(2)}€ - {product.priceRange.max.toFixed(2)}€
            </>
          ) : (
            <>{product.price.toFixed(2)}€</>
          )}
        </p>
      </div>
    </div>
  )
}
