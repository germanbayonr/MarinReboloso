'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ArrowLeft } from 'lucide-react'
import { ProductVariant, useProducts } from '@/lib/products-context'
import { useCart } from '@/lib/cart-context'
import { cn } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { products } = useProducts()
  const { addToCart } = useCart()
  
  const product = useMemo(() => products.find(p => p.id === id), [products, id])
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('U')
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationCoords, setAnimationCoords] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!product?.variants?.[0]) return
    setSelectedVariant(product.variants[0])
    setSelectedImage(0)
  }, [product?.id])

  const galleryImages = useMemo(() => selectedVariant?.images ?? [], [selectedVariant])
  const activeImage = galleryImages[selectedImage] ?? galleryImages[0]

  const isAccessory = useMemo(() => {
    if (!product) return true
    const cat = product.category.toLowerCase()
    return cat.includes('pendiente') || cat.includes('collar') || cat.includes('broche') || cat.includes('peinecillo')
  }, [product])

  if (!product || !selectedVariant || !activeImage) return null

  const handleAddToCart = () => {
    const cartIcon = document.getElementById('cart-icon-target')
    if (imageRef.current && cartIcon) {
      const originRect = imageRef.current.getBoundingClientRect()
      const targetRect = cartIcon.getBoundingClientRect()

      const deltaX = targetRect.left - originRect.left + (targetRect.width / 2) - (originRect.width / 2)
      const deltaY = targetRect.top - originRect.top + (targetRect.height / 2) - (originRect.height / 2)

      setAnimationCoords({ x: deltaX, y: deltaY })
      setIsAnimating(true)

      setTimeout(() => {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: selectedVariant.images[0],
          quantity: 1,
          variant: isAccessory ? selectedVariant.colorName : `${selectedVariant.colorName} · ${selectedSize}`
        })
        setIsAnimating(false)
      }, 700) // Duración de la animación
    }
  }

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />
      
      <div className="pt-24 md:pt-32 pb-20 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-3 h-3" /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Columna Izquierda: Galería */}
          <div className="lg:col-span-7 space-y-4">
            <div ref={imageRef} className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "relative aspect-[3/4] border transition-colors",
                      selectedImage === idx ? "border-foreground" : "border-transparent hover:border-foreground/30"
                    )}
                  >
                    <Image src={img} alt={`${product.name} ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Info (Sticky) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-wide leading-tight">
                    {product.name}
                  </h1>
                  <button 
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="mt-2 text-foreground/40 hover:text-foreground transition-colors"
                  >
                    <Heart className={cn("w-6 h-6", isWishlisted && "fill-foreground text-foreground")} strokeWidth={1.5} />
                  </button>
                </div>
                <p className="text-xl font-sans tracking-wider">{product.price}€</p>

                {product.variants.length > 1 && (
                  <div className="pt-4 space-y-3">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                      COLOR: {(hoveredColor || selectedVariant.colorName).toLocaleUpperCase('es-ES')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.colorName}
                          type="button"
                          onClick={() => {
                            setSelectedVariant(variant)
                            setSelectedImage(0)
                          }}
                          onMouseEnter={() => setHoveredColor(variant.colorName)}
                          onMouseLeave={() => setHoveredColor(null)}
                          className={cn(
                            "inline-flex w-8 h-8 rounded-full border border-border/70 overflow-hidden bg-secondary/30 cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            selectedVariant.colorName === variant.colorName && "ring-2 ring-black ring-offset-2 ring-offset-background"
                          )}
                          aria-label={`Color ${variant.colorName}`}
                          title={variant.colorName}
                        >
                          <span
                            className="w-full h-full rounded-full bg-cover bg-center"
                            style={variant.images?.[0] ? { backgroundImage: `url(${variant.images[0]})` } : undefined}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* Tallas */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  Talla
                </p>
                {isAccessory ? (
                  <p className="text-sm font-medium tracking-widest">TALLA ÚNICA</p>
                ) : (
                  <div className="flex gap-4">
                    {['S', 'M', 'L', 'XL'].map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "w-12 h-12 flex items-center justify-center border text-xs tracking-widest transition-all",
                          selectedSize === size ? "bg-foreground text-background" : "hover:border-foreground"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-foreground text-background py-4 text-xs tracking-[0.3em] uppercase hover:bg-foreground/90 transition-all active:scale-[0.98]"
              >
                Agregar al carrito
              </button>

              {/* Accordions */}
              <Accordion type="single" collapsible className="w-full pt-8">
                <AccordionItem value="description">
                  <AccordionTrigger className="text-[10px] tracking-[0.2em] uppercase">Descripción</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    Esta pieza de la colección {product.collection} ha sido diseñada bajo los más altos estándares de artesanía. 
                    Un equilibrio perfecto entre tradición y modernidad que eleva cualquier conjunto.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="details">
                  <AccordionTrigger className="text-[10px] tracking-[0.2em] uppercase">Detalles y Cuidados</AccordionTrigger>
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

      {/* Clon para animación Fly-to-Cart */}
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
              scale: 1
            }}
            animate={{ 
              x: animationCoords.x,
              y: animationCoords.y,
              scale: 0.05,
              opacity: 0
            }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.7 }}
            className="pointer-events-none overflow-hidden"
          >
            <Image src={selectedVariant.images[0]} alt="fly" fill className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
