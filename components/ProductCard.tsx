'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWishlist } from '@/lib/wishlist-context'
import { computeFinalPrice, hasActiveDiscount } from '@/lib/pricing'

interface ProductCardProps {
  product: {
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
}

const PLACEHOLDER_IMAGE = 'https://marebo.b-cdn.net/assets/Captura%20de%20pantalla%202026-03-10%20a%20las%2011.28.12.jpg'

export default function ProductCard({ product }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [mainImgError, setMainImgError] = useState(false)
  const [hoverImgError, setHoverImgError] = useState(false)
  
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
      
  const mainImage = mainImgError ? PLACEHOLDER_IMAGE : (images[0] || PLACEHOLDER_IMAGE)
  const hoverImage = hoverImgError ? null : (images[1] || null)

  const rawPrice = typeof product.price === 'number' ? product.price : Number(product.price)
  const orig =
    product.original_price != null && product.original_price !== ''
      ? typeof product.original_price === 'number'
        ? product.original_price
        : Number(product.original_price)
      : null
  const disc = Number(product.discount_percent) || 0
  const price = Number.isFinite(rawPrice)
    ? rawPrice
    : orig != null && Number.isFinite(orig)
      ? computeFinalPrice(orig, disc)
      : NaN
  const showDiscount = hasActiveDiscount(orig ?? (Number.isFinite(rawPrice) ? rawPrice : null), disc)
  const formattedPrice = Number.isFinite(price) ? (Number.isInteger(price) ? String(price) : price.toFixed(2)) : '—'
  const formattedOriginal =
    orig != null && Number.isFinite(orig) ? (Number.isInteger(orig) ? String(orig) : orig.toFixed(2)) : null
  const inStock = product.in_stock !== false
  const wishlisted = isInWishlist(product.id)

  return (
    <Link href={`/producto/${product.id}`} className="group block" suppressHydrationWarning>
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-4">
        {!inStock ? (
          <span className="absolute left-3 top-3 z-20 bg-neutral-900 px-2 py-1 text-[10px] uppercase tracking-wider text-white">
            Sin stock
          </span>
        ) : null}
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
          <Image
            unoptimized={true}
            src={mainImage}
            alt={product.name}
            fill
            onError={() => setMainImgError(true)}
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
          <Image
            unoptimized={true}
            src={hoverImage}
            alt={`${product.name} - vista alterna`}
            fill
            onError={() => setHoverImgError(true)}
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
        <div className="flex flex-wrap items-baseline gap-2 text-sm tracking-wide">
          {showDiscount && formattedOriginal ? (
            <>
              <span className="text-muted-foreground line-through">{formattedOriginal}€</span>
              <span className="text-foreground">{formattedPrice}€</span>
              <span className="text-xs text-neutral-500">-{disc}%</span>
            </>
          ) : (
            <span className="text-muted-foreground">{formattedPrice}€</span>
          )}
        </div>
      </div>
    </Link>
  )
}
