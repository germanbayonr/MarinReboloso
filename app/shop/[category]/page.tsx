'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import ProductFilters, { Filters, DEFAULT_FILTERS } from '@/components/ProductFilters'
import { useProducts } from '@/lib/products-context'

export default function ShopCollectionPage() {
  const { products } = useProducts()
  const params = useParams()
  
  const rawCategory = Array.isArray(params?.category) ? params.category[0] : params?.category || ''
  const safeCategory = String(rawCategory).toLowerCase()
  
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const collectionProducts = useMemo(() => {
    if (!safeCategory) return []
    
    // Mapeo de slugs a nombres reales para asegurar el filtrado
    const slugToCollectionName: Record<string, string> = {
      'descara': 'Descará',
      'marebo': 'Marebo',
      'corales': 'Corales',
      'filipa': 'Filipa',
      'jaipur': 'Jaipur'
    }

    const targetName = slugToCollectionName[safeCategory] || safeCategory

    return products.filter(p => 
      p.collection.toLowerCase() === targetName.toLowerCase() || 
      p.collection.toLowerCase() === safeCategory
    )
  }, [products, safeCategory])

  const filtered = useMemo(() => {
    let list = collectionProducts.filter(p => p.status === 'published')

    if (filters.types.length > 0) {
      list = list.filter(p => filters.types.some(t => p.category.toLowerCase().includes(t.toLowerCase())))
    }
    if (filters.collections.length > 0) {
      list = list.filter(p => filters.collections.includes(p.collection))
    }
    list = list.filter(p => p.price <= filters.maxPrice)
    if (filters.onlyInStock) {
      list = list.filter(p => p.stock > 0)
    }

    if (filters.sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (filters.sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else if (filters.sort === 'newest') list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return list
  }, [collectionProducts, filters])

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

      <div className="pt-32 lg:pt-40 pb-16 px-4 md:px-10">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
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
