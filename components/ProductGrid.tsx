'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'

type GridProduct = {
  id: string
  name: string
  price: number | string
  image_url: string | null
  category: string | null
}

export default function ProductGrid() {
  const [items, setItems] = useState<GridProduct[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,price,image_url,category,is_new_arrival')
          .order('is_new_arrival', { ascending: false })
          .order('name', { ascending: true })
          .limit(12)
        if (cancelled) return
        if (error) {
          setItems([])
          setLoaded(true)
          return
        }
        setItems(
          (data ?? []).map((p: any) => ({
            id: String(p.id),
            name: String(p.name ?? ''),
            price: p.price,
            image_url: p.image_url ?? null,
            category: p.category ?? null,
          })),
        )
        setLoaded(true)
      } catch {
        if (!cancelled) {
          setItems([])
          setLoaded(true)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (loaded && items.length === 0) return null

  return (
    <section className="px-6 md:px-10 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {(loaded ? items : Array.from({ length: 8 })).map((product: any, idx: number) =>
            loaded ? (
              <ProductCard key={product.id} product={product} />
            ) : (
              <div key={idx} className="space-y-4">
                <div className="relative aspect-[3/4] bg-stone-100" />
                <div className="h-5 bg-stone-100 w-4/5" />
                <div className="h-4 bg-stone-100 w-24" />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  )
}

