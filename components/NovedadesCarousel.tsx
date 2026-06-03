'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import { imageUrlsFromProductRow } from '@/lib/home-page-images'

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

function mapProductRow(
  row: Record<string, unknown>,
  hiddenSlugs: Set<string>,
): NovedadProduct | null {
  if (isCollectionHidden((row.collection as string) ?? null, hiddenSlugs)) return null
  const urls = imageUrlsFromProductRow(row.image_url)
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    price: row.price as number | string,
    original_price: row.original_price != null ? Number(row.original_price) : null,
    discount_percent: row.discount_percent != null ? Number(row.discount_percent) : null,
    in_stock: typeof row.in_stock === 'boolean' ? row.in_stock : null,
    image_url: urls[0] ?? null,
    category: (row.category as string) ?? null,
    collection: (row.collection as string) ?? null,
  }
}

export default function NovedadesCarousel() {
  const [items, setItems] = useState<NovedadProduct[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(
            'id,name,price,original_price,discount_percent,image_url,category,collection,in_stock,created_at',
          )
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20)

        if (cancelled) return

        if (error) {
          const fallback = await supabase
            .from('products')
            .select(
              'id,name,price,original_price,discount_percent,image_url,category,collection,in_stock',
            )
            .eq('is_active', true)
            .order('name', { ascending: false })
            .limit(20)
          if (cancelled) return
          if (fallback.error) {
            setItems([])
            setLoaded(true)
            return
          }
          const hiddenRes = await fetch('/api/collections/hidden-slugs')
          const hiddenSlugs = new Set<string>(
            hiddenRes.ok ? ((await hiddenRes.json()) as string[]).map((s) => s.toLowerCase()) : [],
          )
          const mapped = (fallback.data ?? [])
            .map((row) => mapProductRow(row as Record<string, unknown>, hiddenSlugs))
            .filter((p): p is NovedadProduct => p != null)
          setItems(mapped)
          setLoaded(true)
          return
        }

        const hiddenRes = await fetch('/api/collections/hidden-slugs')
        const hiddenSlugs = new Set<string>(
          hiddenRes.ok ? ((await hiddenRes.json()) as string[]).map((s) => s.toLowerCase()) : [],
        )
        const mapped = (data ?? [])
          .map((row) => mapProductRow(row as Record<string, unknown>, hiddenSlugs))
          .filter((p): p is NovedadProduct => p != null)
        setItems(mapped)
        setLoaded(true)
      } catch {
        if (!cancelled) {
          setItems([])
          setLoaded(true)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

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
