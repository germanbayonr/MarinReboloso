'use client'

import { useMemo, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import ProductFilters, { DEFAULT_FILTERS, type Filters } from '@/components/ProductFilters'

type CatalogProduct = {
  id: string
  name: string
  price: number | string
  image_url: string | null
  category?: string | null
  collection?: string | null
  is_new_arrival?: boolean | null
  stock?: number | null
  in_stock?: boolean | null
}

function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function collectionLabelFromSlug(slug: string) {
  const s = String(slug ?? '').toLowerCase().trim()
  if (s === 'descara') return 'Descará'
  if (s === 'marebo') return 'Marebo'
  if (s === 'corales') return 'Corales'
  if (s === 'filipa') return 'Filipa'
  if (s === 'jaipur' || s === 'lost-in-jaipur') return 'Jaipur'
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

function isInStock(product: CatalogProduct) {
  if (typeof product.in_stock === 'boolean') return product.in_stock
  if (typeof product.stock === 'number') return product.stock > 0
  return true
}

export default function ProductCatalogClient({
  title,
  products,
}: {
  title: string
  products: CatalogProduct[]
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    const out = products.filter((p) => {
      const price = toNumber(p.price)
      if (filters.maxPrice < 500 && price > filters.maxPrice) return false

      if (filters.types.length > 0) {
        const cat = String(p.category ?? '').toLowerCase()
        if (!filters.types.includes(cat)) return false
      }

      if (filters.collections.length > 0) {
        const label = collectionLabelFromSlug(p.collection ?? '')
        if (!filters.collections.includes(label)) return false
      }

      if (filters.onlyInStock && !isInStock(p)) return false

      return true
    })

    if (filters.sort === 'price-asc') {
      return out.slice().sort((a, b) => toNumber(a.price) - toNumber(b.price))
    }
    if (filters.sort === 'price-desc') {
      return out.slice().sort((a, b) => toNumber(b.price) - toNumber(a.price))
    }
    if (filters.sort === 'newest') {
      return out
        .slice()
        .sort((a, b) => Number(Boolean(b.is_new_arrival)) - Number(Boolean(a.is_new_arrival)) || a.name.localeCompare(b.name))
    }

    return out
  }, [filters.collections, filters.maxPrice, filters.onlyInStock, filters.sort, filters.types, products])

  return (
    <div className="pt-28 lg:pt-32 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">{title}</h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">{filtered.length} piezas</p>
        </div>
      </div>

      <div className="mb-8">
        <ProductFilters
          filters={filters}
          setFilters={setFilters}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          resultCount={filtered.length}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-serif text-xl text-muted-foreground">No hay piezas con estos filtros</p>
        </div>
      )}
    </div>
  )
}
