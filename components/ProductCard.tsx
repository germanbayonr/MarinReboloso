'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/lib/wishlist-context'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number | string
    image_url: string[] | string | null
    category?: string | null
    collection?: string | null
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  
  // Normalizar image_url a un array y corregir doble encoding de Bunny
  const images = useMemo(() => {
    const rawImages = Array.isArray(product.image_url) 
      ? product.image_url 
      : product.image_url 
        ? [product.image_url] 
        : []
    
    return rawImages.map(url => {
      try {
        // Corregir %2520 -> %20
        return decodeURIComponent(url)
      } catch {
        return url
      }
    })
  }, [product.image_url])
      
  const mainImage = images[0] || 'https://marebo.b-cdn.net/placeholder.jpg'
  const hoverImage = images[1] || null
  
  const price = typeof product.price === 'number' ? product.price : Number(product.price)
  const formattedPrice = Number.isFinite(price) ? (Number.isInteger(price) ? String(price) : price.toFixed(2)) : '—'
  const wishlisted = isInWishlist(product.id)

  return (
    <Link href={`/producto/${product.id}`} className="group block" suppressHydrationWarning>
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-4">
        <button
          type="button"
          aria-label={wishlisted ? 'Quitar de wishlist' : 'Añadir a wishlist'}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (wishlisted) {
              removeFromWishlist(product.id)
              return
            }
            addToWishlist({
              id: product.id,
              name: product.name,
              price: Number.isFinite(price) ? price : 0,
              image: mainImage,
              href: `/producto/${product.id}`,
            })
          }}
          className={cn(
            'absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center',
            'transition-transform duration-300 ease-out active:scale-90',
          )}
          suppressHydrationWarning
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-colors duration-300',
              wishlisted ? 'fill-gray-900 text-gray-900' : 'text-gray-900',
            )}
            strokeWidth={1.5}
          />
        </button>
        
        {/* Imagen Principal */}
        {mainImage ? (
          <Image unoptimized
            src={mainImage}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            className={cn(
              "object-cover transition-all duration-700 ease-out",
              hoverImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"
            )}
          />
        ) : null}

        {/* Imagen Hover */}
        {hoverImage ? (
          <Image unoptimized
            src={hoverImage}
            alt={`${product.name} - vista alterna`}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-105 group-hover:scale-100"
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
