'use client'

import { useMemo, useState } from 'react'
import ProductFilters, { DEFAULT_FILTERS, type Filters } from '@/components/ProductFilters'
import ProductGrid from '@/components/ProductGrid'

type CollectionProduct = {
  id: string
  name: string
  price: number | string
  image_url: string[] | string | null
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

function isInStock(product: CollectionProduct) {
  if (typeof product.in_stock === 'boolean') return product.in_stock
  if (typeof product.stock === 'number') return product.stock > 0
  return true
}

export default function CollectionProductsClient({
  products,
}: {
  products: CollectionProduct[]
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
        .sort(
          (a, b) =>
            Number(Boolean(b.is_new_arrival)) - Number(Boolean(a.is_new_arrival)) ||
            String(a.name).localeCompare(String(b.name)),
        )
    }

    return out
  }, [filters.maxPrice, filters.onlyInStock, filters.sort, filters.types, products])

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="font-sans text-sm text-muted-foreground">{filtered.length} piezas</p>
        </div>
        <ProductFilters
          filters={filters}
          setFilters={setFilters}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          resultCount={filtered.length}
        />
      </div>

      <ProductGrid products={filtered} />
    </div>
  )
}

