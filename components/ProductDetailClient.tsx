'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { cn } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export type SupabaseProduct = {
  id: string
  name: string
  description: string | null
  price: number | string
  image_url: string[] | string | null
  category: string | null
  collection?: string | null
  stripe_product_id?: string | null
  stripe_price_id?: string | null
}

function toNumber(value: number | string) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function ProductDetailClient({ product }: { product: SupabaseProduct | null }) {
  const router = useRouter()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const [isAnimating, setIsAnimating] = useState(false)
  const [animationCoords, setAnimationCoords] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState('Único')
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const price = useMemo(() => (product ? toNumber(product.price) : 0), [product])
  const formattedPrice = useMemo(() => (Number.isFinite(price) ? (Number.isInteger(price) ? String(price) : price.toFixed(2)) : '—'), [price])
  
  // Normalizar image_url a array
  const images = useMemo(() => {
    if (!product?.image_url) return []
    return Array.isArray(product.image_url) ? product.image_url : [product.image_url]
  }, [product?.image_url])

  const mainImageUrl = images[activeImageIndex] || images[0] || ''
  const productHref = product ? `/producto/${product.id}` : ''

  if (!product) {
    return (
      <main className="min-h-screen bg-background" suppressHydrationWarning>
        <Navbar />
        <div className="pt-24 md:pt-32 pb-20 px-6 md:px-12 lg:px-24 max-w-3xl mx-auto text-center">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Producto no disponible
          </p>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">No encontramos esta pieza</h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Es posible que el enlace esté desactualizado o que el producto ya no esté disponible.
          </p>
          <button
            onClick={() => router.push('/catalogo')}
            className="inline-flex mt-10 border border-foreground px-10 py-4 font-sans text-xs tracking-[0.25em] uppercase hover:bg-foreground hover:text-background transition-all duration-300"
            suppressHydrationWarning
          >
            Ver catálogo
          </button>
        </div>
        <Footer />
      </main>
    )
  }

  const wishlisted = isInWishlist(product.id)

  const handleAddToCart = () => {
    const cartIcon = document.getElementById('cart-icon-target')
    if (imageRef.current && cartIcon) {
      const originRect = imageRef.current.getBoundingClientRect()
      const targetRect = cartIcon.getBoundingClientRect()

      const deltaX = targetRect.left - originRect.left + targetRect.width / 2 - originRect.width / 2
      const deltaY = targetRect.top - originRect.top + targetRect.height / 2 - originRect.height / 2

      setAnimationCoords({ x: deltaX, y: deltaY })
      setIsAnimating(true)

      setTimeout(() => {
        addToCart({
          id: product.id,
          name: product.name,
          price,
          image: mainImageUrl,
          quantity,
          variant: selectedVariant,
          stripe_price_id: product.stripe_product_id ?? null,
        })
        setIsAnimating(false)
      }, 700)
      return
    }

    addToCart({
      id: product.id,
      name: product.name,
      price,
      image: mainImageUrl,
      quantity,
      variant: selectedVariant,
      stripe_price_id: product.stripe_product_id ?? null,
    })
  }

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="pt-24 md:pt-32 pb-20 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
          suppressHydrationWarning
        >
          <ArrowLeft className="w-3 h-3" /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7 space-y-4">
            <div ref={imageRef} className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
              {mainImageUrl ? (
                <Image
                  src={mainImageUrl}
                  alt={product.name}
                  fill
                  priority={true}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : null}
            </div>
            
            {/* Galería de Miniaturas */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "relative aspect-[4/5] bg-stone-100 overflow-hidden border transition-all duration-300",
                      activeImageIndex === idx ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} miniatura ${idx + 1}`}
                      fill
                      sizes="15vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 space-y-8">
              <div className="space-y-4">
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-wide leading-tight">
                  {product.name}
                </h1>
                <p className="text-xl font-sans tracking-wider">{formattedPrice}€</p>
                <p className="text-sm md:text-base leading-relaxed text-muted-foreground tracking-wide">
                  {product.description ||
                    'Esta pieza ha sido diseñada bajo los más altos estándares de artesanía. Un equilibrio perfecto entre tradición y modernidad que eleva cualquier conjunto.'}
                </p>
              </div>

              <div className="space-y-6 pt-6 border-t border-border/50">
                <div className="space-y-2">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Variante</p>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVariant('Único')}
                      className={cn(
                        'h-11 px-4 border text-xs tracking-[0.3em] uppercase transition-colors',
                        selectedVariant === 'Único'
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-transparent text-foreground hover:bg-foreground hover:text-background',
                      )}
                      suppressHydrationWarning
                    >
                      Único
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Cantidad</p>
                  <div className="inline-flex items-center border border-border">
                    <button
                      type="button"
                      aria-label="Disminuir cantidad"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-12 h-12 flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
                      suppressHydrationWarning
                    >
                      −
                    </button>
                    <div className="w-14 h-12 flex items-center justify-center text-base tracking-widest">
                      {quantity}
                    </div>
                    <button
                      type="button"
                      aria-label="Aumentar cantidad"
                      onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                      className="w-12 h-12 flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
                      suppressHydrationWarning
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full bg-foreground text-background py-4 text-base tracking-[0.3em] uppercase hover:bg-foreground/90 transition-all active:scale-[0.98]"
                  suppressHydrationWarning
                >
                  Añadir a la cesta
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (wishlisted) {
                      removeFromWishlist(product.id)
                      return
                    }
                    addToWishlist({
                      id: product.id,
                      name: product.name,
                      price,
                      image: mainImageUrl,
                      href: productHref,
                    })
                  }}
                  className="w-full border border-foreground bg-transparent text-foreground py-4 text-base tracking-[0.3em] uppercase hover:bg-foreground hover:text-background transition-colors inline-flex items-center justify-center gap-3"
                  suppressHydrationWarning
                >
                  <Heart
                    className={cn(
                      'w-5 h-5 transition-colors duration-300',
                      wishlisted ? 'fill-foreground text-foreground' : 'text-foreground',
                    )}
                    strokeWidth={1.5}
                  />
                  {wishlisted ? 'En wishlist' : 'Añadir a wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{
              position: 'fixed',
              top: imageRef.current?.getBoundingClientRect().top,
              left: imageRef.current?.getBoundingClientRect().left,
              width: imageRef.current?.getBoundingClientRect().width,
              height: imageRef.current?.getBoundingClientRect().height,
              zIndex: 9999,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: animationCoords.x,
              y: animationCoords.y,
              scale: 0.05,
              opacity: 0,
            }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.7 }}
            className="pointer-events-none overflow-hidden"
          >
            {mainImageUrl ? <Image src={mainImageUrl} alt="fly" fill className="object-cover" /> : null}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
