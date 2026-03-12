'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useProducts } from '@/lib/products-context'
import { InteractiveCard } from '@/components/InteractiveCard'

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
    <section className="py-16 md:py-24 bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-10 mb-8 flex items-end justify-between">
        <div>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Lo último</p>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Novedades</h2>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          {/* Prev/Next */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={scrollPrev}
              className="w-8 h-8 border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
              aria-label="Anterior"
              suppressHydrationWarning
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={scrollNext}
              className="w-8 h-8 border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
              aria-label="Siguiente"
              suppressHydrationWarning
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <Link
            href="/catalogo"
            className="flex items-center gap-1.5 font-sans text-[10px] tracking-widest uppercase hover:text-accent transition-colors"
            suppressHydrationWarning
          >
            Ver todo
            <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Embla carousel */}
      <div
        className="overflow-hidden pl-4 md:pl-10"
        ref={emblaRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex gap-4 md:gap-5">
          {featured.map(product => (
            <div key={product.id} className="flex-shrink-0 w-[240px] md:w-[280px]">
              <InteractiveCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 border border-foreground px-8 py-3 font-sans text-[10px] tracking-[0.25em] uppercase hover:bg-foreground hover:text-background transition-all duration-300"
          suppressHydrationWarning
        >
          Ver todo el catálogo
          <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  )
}
