'use client'

import { useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import ProductCard from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'

type ListingProduct = {
  id: string
  name: string
  price: number | string
  image_url: string | null
  category: string | null
}

const categoryTitles: Record<string, string> = {
  pendientes: 'Pendientes',
  mantones: 'Mantones',
  accesorios: 'Accesorios',
  peinecillos: 'Peinecillos',
  broches: 'Broches',
  pulseras: 'Pulseras',
  collares: 'Collares',
  bolsos: 'Bolsos',
}

export default function ProductListingClient({ category }: { category: string }) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [items, setItems] = useState<ListingProduct[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,price,image_url,category')
          .eq('category', category)
          .order('name', { ascending: true })
          .limit(5000)

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
  }, [category])

  const filteredProducts = useMemo(() => {
    return items.filter((p) => {
      const n = typeof p.price === 'number' ? p.price : Number(p.price)
      if (!Number.isFinite(n)) return false
      return n >= priceRange[0] && n <= priceRange[1]
    })
  }, [items, priceRange])

  const title = categoryTitles[category] || category.charAt(0).toUpperCase() + category.slice(1)

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif text-sm mb-4 tracking-[0.15em] uppercase">Precio</h3>
        <div className="space-y-2.5">
          {[
            { label: 'Todos los precios', min: 0, max: 500 },
            { label: 'Menos de 50€', min: 0, max: 49 },
            { label: '50€ – 150€', min: 50, max: 150 },
            { label: 'Más de 150€', min: 151, max: 500 },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer group/label">
              <input
                type="radio"
                name="price"
                checked={priceRange[0] === opt.min && priceRange[1] === opt.max}
                onChange={() => setPriceRange([opt.min, opt.max])}
                className="w-3.5 h-3.5 accent-foreground"
                suppressHydrationWarning
              />
              <span className="text-sm text-muted-foreground group-hover/label:text-foreground transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Productos</p>
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight">{title}</h1>
            <p className="font-sans text-sm text-muted-foreground mt-1">{filteredProducts.length} piezas</p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="inline-flex items-center gap-2 border border-border px-4 py-2 text-[10px] tracking-[0.3em] uppercase hover:bg-foreground hover:text-background transition-colors">
                <Filter className="w-3.5 h-3.5" />
                Filtros
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[380px]">
              <SheetTitle className="font-serif text-xl tracking-wide mb-8">Filtros</SheetTitle>
              <FilterContent />
            </SheetContent>
          </Sheet>
        </div>

        <div className="mt-10">
          {filteredProducts.length === 0 ? (
            !loaded ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="relative aspect-[3/4] bg-stone-100" />
                    <div className="h-5 bg-stone-100 w-4/5" />
                    <div className="h-4 bg-stone-100 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted-foreground text-sm">No se encontraron productos con estos filtros.</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
