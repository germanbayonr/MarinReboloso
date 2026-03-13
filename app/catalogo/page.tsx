'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import ProductFilters, { Filters, DEFAULT_FILTERS } from '@/components/ProductFilters'
import { supabase } from '@/lib/supabase'

export default function CatalogoPage() {
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; price: number | string; image_url: string | null; category: string | null; is_new_arrival: boolean }>
  >([])
  const [loaded, setLoaded] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,price,image_url,category,is_new_arrival')
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

  const filtered = useMemo(() => {
    let list = products

    if (filters.types.length > 0) {
      list = list.filter((p) => filters.types.some((t) => (p.category ?? '').toLowerCase().includes(t)))
    }
    list = list.filter((p) => {
      const n = typeof p.price === 'number' ? p.price : Number(p.price)
      return Number.isFinite(n) ? n <= filters.maxPrice : false
    })

    if (filters.sort === 'price-asc')
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price))
    else if (filters.sort === 'price-desc')
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price))
    else if (filters.sort === 'newest')
      list = [...list].sort((a, b) => {
        if (a.is_new_arrival !== b.is_new_arrival) return a.is_new_arrival ? -1 : 1
        return a.name.localeCompare(b.name)
      })

    return list
  }, [products, filters])

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="pt-28 lg:pt-32 pb-16 px-4 md:px-10">
        {/* Page header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Catálogo</h1>
            <p className="font-sans text-sm text-muted-foreground mt-1">{filtered.length} piezas</p>
          </div>

          <ProductFilters
            filters={filters}
            setFilters={setFilters}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            resultCount={filtered.length}
          />
        </div>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : !loaded ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="space-y-4">
                <div className="relative aspect-[3/4] bg-stone-100" />
                <div className="h-5 bg-stone-100 w-4/5" />
                <div className="h-4 bg-stone-100 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="font-serif text-xl text-muted-foreground">No hay piezas con estos filtros</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 font-sans text-[10px] tracking-widest uppercase underline text-muted-foreground hover:text-foreground transition-colors"
              suppressHydrationWarning
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
