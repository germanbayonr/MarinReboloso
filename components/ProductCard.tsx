'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/lib/products-context'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const images = product.variants[0]?.images ?? []

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <Link
      href={`/shop/producto/${product.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      suppressHydrationWarning
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative h-full w-full"
          >
            <Image
              src={images[currentImageIndex] ?? images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>
        </AnimatePresence>

        {/* Carrusel Arrows - Only if images > 1 */}
        {images.length > 1 && isHovered && (
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <button
              onClick={prevImage}
              className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-black pointer-events-auto hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-black pointer-events-auto hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Collection Tag */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] tracking-[0.2em] uppercase bg-white/90 px-2 py-1 text-black font-medium">
            {product.collection}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-serif text-lg text-foreground group-hover:text-foreground/60 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground tracking-wide">
          {product.price}€
        </p>
      </div>
    </Link>
  )
}
