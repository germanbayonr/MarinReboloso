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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export type SupabaseProduct = {
  id: string
  name: string
  description: string | null
  price: number | string
  image_url: string | null
  category: string | null
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

  const price = useMemo(() => (product ? toNumber(product.price) : 0), [product])
  const imageUrl = product?.image_url ?? ''

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
          image: imageUrl,
          quantity: 1,
          variant: 'Único',
          stripe_price_id: product.stripe_price_id ?? null,
        })
        setIsAnimating(false)
      }, 700)
      return
    }

    addToCart({
      id: product.id,
      name: product.name,
      price,
      image: imageUrl,
      quantity: 1,
      variant: 'Único',
      stripe_price_id: product.stripe_price_id ?? null,
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
            <div ref={imageRef} className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
              {imageUrl ? (
                <Image src={imageUrl} alt={product.name} fill priority className="object-cover" />
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-6">
                  <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-wide leading-tight">
                    {product.name}
                  </h1>
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
                        image: imageUrl,
                        href: `/producto/${product.id}`,
                      })
                    }}
                    aria-label={wishlisted ? 'Quitar de wishlist' : 'Añadir a wishlist'}
                    className={cn(
                      'mt-1 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center',
                      'transition-[opacity,transform,background-color] duration-300 ease-out active:scale-90',
                    )}
                    suppressHydrationWarning
                  >
                    <Heart
                      className={cn(
                        'w-6 h-6 transition-colors duration-300',
                        wishlisted ? 'fill-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-900',
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                <p className="text-xl font-sans tracking-wider">{price.toFixed(2)}€</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Talla</p>
                <p className="text-sm font-medium tracking-widest">TALLA ÚNICA</p>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-foreground text-background py-4 text-xs tracking-[0.3em] uppercase hover:bg-foreground/90 transition-all active:scale-[0.98]"
                suppressHydrationWarning
              >
                Agregar al carrito
              </button>

              <Accordion type="single" collapsible className="w-full pt-8">
                <AccordionItem value="description">
                  <AccordionTrigger className="text-[10px] tracking-[0.2em] uppercase">Descripción</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {product.description ||
                      'Esta pieza ha sido diseñada bajo los más altos estándares de artesanía. Un equilibrio perfecto entre tradición y modernidad que eleva cualquier conjunto.'}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="details">
                  <AccordionTrigger className="text-[10px] tracking-[0.2em] uppercase">
                    Detalles y Cuidados
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground space-y-2">
                    <p>• Material: Baño de oro de 18k / Plata de ley</p>
                    <p>• Piedras: Corales naturales / Cristales checos</p>
                    <p>• Evitar el contacto directo con perfumes y agua</p>
                    <p>• Limpiar con un paño suave y seco tras su uso</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
            {imageUrl ? <Image src={imageUrl} alt="fly" fill className="object-cover" /> : null}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
