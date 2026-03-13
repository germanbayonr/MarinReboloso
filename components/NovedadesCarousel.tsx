'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useProducts } from '@/lib/products-context'
import ProductCard from '@/components/ProductCard'

export default function NovedadesCarousel() {
  const { products } = useProducts()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true })
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [paused, setPaused] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Auto-scroll every 2.8s, pause on hover
  useEffect(() => {
    if (!emblaApi || paused) return
    autoScrollTimer.current = setInterval(() => {
      emblaApi.scrollNext()
    }, 2800)
    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current)
    }
  }, [emblaApi, paused])

  // Show only published products, newest first, max 12
  const featured = products
    .filter(p => p.status === 'published')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12)

  if (featured.length === 0) return null

  return (
    <section className="py-20 md:py-32 bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-12 mb-10 md:mb-12 flex items-end justify-between">
        <div>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">Lo último</p>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight">Novedades</h2>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          {/* Prev/Next */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={scrollPrev}
              className="w-11 h-11 border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
              aria-label="Anterior"
              suppressHydrationWarning
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={scrollNext}
              className="w-11 h-11 border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
              aria-label="Siguiente"
              suppressHydrationWarning
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
          <Link
            href="/catalogo"
            className="flex items-center gap-2 font-sans text-xs tracking-widest uppercase hover:text-accent transition-colors"
            suppressHydrationWarning
          >
            Ver todo
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Embla carousel */}
      <div
        className="overflow-hidden pl-4 md:pl-12"
        ref={emblaRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex gap-5 md:gap-6">
          {featured.map(product => (
            <div key={product.id} className="flex-shrink-0 w-[260px] md:w-[320px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 md:mt-14 text-center">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-3 border border-foreground px-10 py-4 font-sans text-xs tracking-[0.25em] uppercase hover:bg-foreground hover:text-background transition-all duration-300"
          suppressHydrationWarning
        >
          Ver todo el catálogo
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  )
}
