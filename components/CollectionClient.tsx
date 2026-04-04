'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'

interface CollectionClientProps {
  collectionSlug: string
  title: string
  description: string
}

export default function CollectionClient({ collectionSlug, title, description }: CollectionClientProps) {
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; price: number | string; image_url: string | null; category: string | null; is_new_arrival: boolean }>
  >([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,price,image_url,category,is_new_arrival')
          .eq('is_active', true)
          .limit(500)
        if (cancelled) return
        if (error) {
          setProducts([])
          setLoaded(true)
          return
        }
        setProducts(
          (data ?? []).map((p) => ({
            id: String((p as any).id),
            name: String((p as any).name ?? ''),
            price: (p as any).price,
            image_url: (p as any).image_url ?? null,
            category: (p as any).category ?? null,
            is_new_arrival: Boolean((p as any).is_new_arrival),
          })),
        )
        setLoaded(true)
      } catch {
        if (!cancelled) {
          setProducts([])
          setLoaded(true)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const scopedProducts = useMemo(() => {
    const slug = collectionSlug.toLowerCase()
    const knownCategories = new Set(['mantones', 'peinecillos', 'collares', 'bolsos', 'pendientes', 'pulseras', 'accesorios'])
    if (knownCategories.has(slug)) return products.filter((p) => (p.category ?? '').toLowerCase() === slug)
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    const needle = normalize(slug)
    return products.filter((p) => normalize(p.name).includes(needle))
  }, [collectionSlug, products])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center">
          <h1 className="font-serif text-4xl md:text-5xl tracking-wide mb-4">{title}</h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loaded && scopedProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Próximamente nuevos productos en esta colección.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(loaded ? scopedProducts : Array.from({ length: 8 })).map((product: any, idx: number) => (
              loaded ? (
                <ProductCard key={product.id} product={product} />
              ) : (
                <div key={idx} className="space-y-4">
                  <div className="relative aspect-[3/4] bg-stone-100" />
                  <div className="h-5 bg-stone-100 w-4/5" />
                  <div className="h-4 bg-stone-100 w-24" />
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
