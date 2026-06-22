'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { useSiteCatalog } from '@/lib/site-catalog-context'
import { gridImageFieldForProduct } from '@/lib/product-display-images'

interface NovedadProduct {
  id: string
  name: string
  price: number | string
  original_price?: number | null
  discount_percent?: number | null
  in_stock?: boolean | null
  image_url: string | null
  category: string | null
  collection: string | null
}

const MIN_ITEMS_FOR_LOOP = 4

function isCollectionHidden(collection: string | null, hiddenSlugs: Set<string>) {
  const slug = (collection ?? '').trim().toLowerCase()
  if (!slug) return false
  for (const h of hiddenSlugs) {
    if (slug === h || (h === 'jaipur' && slug === 'lost-in-jaipur')) return true
  }
  return false
}

export default function NovedadesCarousel() {
  const { ready, loading, products, hiddenCollectionSlugs } = useSiteCatalog()
  const [loaded, setLoaded] = useState(false)

  const items = useMemo(() => {
    if (!ready) return []
    return products
      .filter((p) => !isCollectionHidden(p.collection, hiddenCollectionSlugs))
      .sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0
        const tb = b.created_at ? Date.parse(b.created_at) : 0
        return tb - ta
      })
      .slice(0, 20)
      .map(
        (p): NovedadProduct => ({
          id: p.id,
          name: p.name,
          price: p.price,
          original_price: p.original_price,
          discount_percent: p.discount_percent,
          in_stock: p.in_stock,
          image_url: gridImageFieldForProduct(p),
          category: p.category,
          collection: p.collection,
        }),
      )
  }, [ready, products, hiddenCollectionSlugs])

  useEffect(() => {
    if (ready || (!loading && !ready)) setLoaded(true)
  }, [ready, loading])

  const loopItems = useMemo(() => {
    if (items.length === 0) return []
    if (items.length >= MIN_ITEMS_FOR_LOOP) return [...items, ...items]
    const repeated: NovedadProduct[] = []
    while (repeated.length < MIN_ITEMS_FOR_LOOP * 2) {
      repeated.push(...items)
    }
    return [...repeated, ...repeated]
  }, [items])

  const animationDurationSec = useMemo(() => {
    const count = items.length || 1
    return Math.min(70, Math.max(28, count * 4))
  }, [items.length])

  if (loaded && items.length === 0) return null

  return (
    <section className="py-20 md:py-32 bg-background overflow-hidden" aria-label="Últimos productos">
      <div className="px-4 md:px-12 mb-10 md:mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">Lo último</p>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight">Novedades</h2>
          <p className="mt-2 font-sans text-sm text-muted-foreground max-w-md">
            Los productos más recientes añadidos a la tienda
          </p>
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

      {!loaded ? (
        <div className="px-4 md:px-12 flex gap-6 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[260px] md:w-[300px] aspect-[4/5] bg-stone-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="novedades-marquee-viewport novedades-marquee-mask overflow-hidden">
          <div
            className="novedades-marquee-track flex w-max gap-6 md:gap-6 pl-4 md:pl-12"
            style={{ animationDuration: `${animationDurationSec}s` }}
          >
            {loopItems.map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                className="shrink-0 w-[260px] md:w-[300px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="sr-only">Carrusel en movimiento continuo. Pasa el cursor por encima para pausar.</p>

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
