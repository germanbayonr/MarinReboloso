'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import ProductFilters, { Filters, DEFAULT_FILTERS } from '@/components/ProductFilters'
import { supabase } from '@/lib/supabase'

export default function ShopCollectionPage() {
  const params = useParams()
  
  const rawCategory = Array.isArray(params?.category) ? params.category[0] : params?.category || ''
  const safeCategory = String(rawCategory).toLowerCase()
  
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
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

  const categoryProducts = useMemo(() => {
    if (!safeCategory) return products
    const knownCategories = new Set(['mantones', 'peinecillos', 'collares', 'bolsos', 'pendientes', 'pulseras', 'accesorios'])
    if (knownCategories.has(safeCategory)) {
      return products.filter((p) => (p.category ?? '').toLowerCase() === safeCategory)
    }

    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

    const needle = normalize(safeCategory)
    return products.filter((p) => normalize(p.name).includes(needle))
  }, [products, safeCategory])

  const filtered = useMemo(() => {
    let list = categoryProducts

    if (filters.types.length > 0) {
      list = list.filter((p) => filters.types.some((t) => (p.category ?? '').toLowerCase().includes(t.toLowerCase())))
    }
    list = list.filter((p) => {
      const n = typeof p.price === 'number' ? p.price : Number(p.price)
      return Number.isFinite(n) ? n <= filters.maxPrice : false
    })

    if (filters.sort === 'price-asc') list = [...list].sort((a, b) => Number(a.price) - Number(b.price))
    else if (filters.sort === 'price-desc') list = [...list].sort((a, b) => Number(b.price) - Number(a.price))
    else if (filters.sort === 'newest')
      list = [...list].sort((a, b) => {
        if (a.is_new_arrival !== b.is_new_arrival) return a.is_new_arrival ? -1 : 1
        return a.name.localeCompare(b.name)
      })

    return list
  }, [categoryProducts, filters])

  const displayTitle = useMemo(() => {
    if (!safeCategory) return 'Colección'
    const slugToCollectionName: Record<string, string> = {
      'descara': 'Descará',
      'marebo': 'Marebo',
      'corales': 'Corales',
      'filipa': 'Filipa',
      'jaipur': 'Jaipur'
    }
    return slugToCollectionName[safeCategory] || (safeCategory.charAt(0).toUpperCase() + safeCategory.slice(1))
  }, [safeCategory])

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="pt-32 lg:pt-40 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Colección</p>
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight">{displayTitle}</h1>
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : !loaded ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
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
            <p className="font-serif text-xl text-muted-foreground">No hay piezas en esta colección con estos filtros</p>
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
