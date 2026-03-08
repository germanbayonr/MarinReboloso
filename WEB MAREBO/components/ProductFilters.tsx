'use client'

import { SlidersHorizontal, ChevronDown, X } from 'lucide-react'

export const PRODUCT_TYPES = ['Pendientes', 'Collares', 'Bolsos', 'Mantoncillos', 'Peinecillos', 'Broches', 'Pulseras', 'Accesorios']
export const COLLECTIONS = ['Descará', 'Marebo', 'Corales', 'Filipa', 'Jaipur']

export interface Filters {
  types: string[]
  collections: string[]
  maxPrice: number
  onlyDiscount: boolean
  onlyInStock: boolean
  sort: string
}

export const DEFAULT_FILTERS: Filters = {
  types: [],
  collections: [],
  maxPrice: 500,
  onlyDiscount: false,
  onlyInStock: false,
  sort: 'featured',
}

function FilterPanel({
  filters,
  setFilters,
}: {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
}) {
  const toggle = (key: 'types' | 'collections', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }))
  }

  return (
    <div className="border border-border bg-background p-5 mt-2 grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Tipo */}
      <div>
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase mb-3 text-muted-foreground">Tipo</p>
        <div className="space-y-2">
          {PRODUCT_TYPES.map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.types.includes(type.toLowerCase())}
                onChange={() => toggle('types', type.toLowerCase())}
                className="w-3.5 h-3.5 border-border accent-foreground"
                suppressHydrationWarning
              />
              <span className="font-sans text-sm text-muted-foreground group-hover:text-foreground transition-colors">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase mb-3 text-muted-foreground">Precio máx.</p>
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={filters.maxPrice}
            onChange={e => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
            className="w-full accent-foreground"
            suppressHydrationWarning
          />
          <p className="font-sans text-sm text-foreground">Hasta {filters.maxPrice} €</p>
        </div>
      </div>

      {/* Colecciones */}
      <div>
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase mb-3 text-muted-foreground">Colecciones</p>
        <div className="space-y-2">
          {COLLECTIONS.map(col => (
            <label key={col} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.collections.includes(col)}
                onChange={() => toggle('collections', col)}
                className="w-3.5 h-3.5 border-border accent-foreground"
                suppressHydrationWarning
              />
              <span className="font-sans text-sm italic text-muted-foreground group-hover:text-foreground transition-colors">{col}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div>
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase mb-3 text-muted-foreground">Especial</p>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-sans text-sm text-muted-foreground">Descuentos</span>
            <button
              role="switch"
              aria-checked={filters.onlyDiscount}
              onClick={() => setFilters(prev => ({ ...prev, onlyDiscount: !prev.onlyDiscount }))}
              className={`relative w-9 h-5 transition-colors duration-200 ${filters.onlyDiscount ? 'bg-foreground' : 'bg-border'}`}
              suppressHydrationWarning
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white transition-transform duration-200 ${filters.onlyDiscount ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-sans text-sm text-muted-foreground">En stock</span>
            <button
              role="switch"
              aria-checked={filters.onlyInStock}
              onClick={() => setFilters(prev => ({ ...prev, onlyInStock: !prev.onlyInStock }))}
              className={`relative w-9 h-5 transition-colors duration-200 ${filters.onlyInStock ? 'bg-foreground' : 'bg-border'}`}
              suppressHydrationWarning
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white transition-transform duration-200 ${filters.onlyInStock ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>
      </div>

      {/* Ordenar + reset */}
      <div>
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase mb-3 text-muted-foreground">Ordenar</p>
        <div className="space-y-2">
          {[
            { value: 'featured', label: 'Destacados' },
            { value: 'price-asc', label: 'Precio: menor' },
            { value: 'price-desc', label: 'Precio: mayor' },
            { value: 'newest', label: 'Más nuevos' },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="sort-filter"
                value={opt.value}
                checked={filters.sort === opt.value}
                onChange={() => setFilters(prev => ({ ...prev, sort: opt.value }))}
                className="accent-foreground"
                suppressHydrationWarning
              />
              <span className="font-sans text-sm text-muted-foreground group-hover:text-foreground transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
        <button
          onClick={() => setFilters(DEFAULT_FILTERS)}
          className="mt-4 font-sans text-[10px] tracking-widest uppercase underline text-muted-foreground hover:text-foreground transition-colors"
          suppressHydrationWarning
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  )
}

interface ProductFiltersProps {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  filtersOpen: boolean
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>
  resultCount: number
}

export default function ProductFilters({
  filters,
  setFilters,
  filtersOpen,
  setFiltersOpen,
  resultCount,
}: ProductFiltersProps) {
  const activeFilterCount =
    filters.types.length +
    filters.collections.length +
    (filters.maxPrice < 500 ? 1 : 0) +
    (filters.onlyDiscount ? 1 : 0) +
    (filters.onlyInStock ? 1 : 0)

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setFiltersOpen(v => !v)}
        className="flex items-center gap-2 border border-border px-4 py-2.5 font-sans text-[10px] tracking-widest uppercase hover:bg-secondary/40 transition-colors"
        suppressHydrationWarning
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
        Filtros
        {activeFilterCount > 0 && (
          <span className="ml-1 w-4 h-4 flex items-center justify-center bg-foreground text-background text-[9px] rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 ml-1 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>

      {/* Panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ${filtersOpen ? 'max-h-[900px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}
      >
        <FilterPanel filters={filters} setFilters={setFilters} />
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.types.map(t => (
            <button
              key={t}
              onClick={() => setFilters(prev => ({ ...prev, types: prev.types.filter(x => x !== t) }))}
              className="flex items-center gap-1.5 border border-border px-3 py-1 font-sans text-[10px] tracking-widest uppercase hover:bg-secondary/40 transition-colors"
              suppressHydrationWarning
            >
              {t} <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          ))}
          {filters.collections.map(c => (
            <button
              key={c}
              onClick={() => setFilters(prev => ({ ...prev, collections: prev.collections.filter(x => x !== c) }))}
              className="flex items-center gap-1.5 border border-border px-3 py-1 font-sans text-[10px] italic hover:bg-secondary/40 transition-colors"
              suppressHydrationWarning
            >
              {c} <X className="h-3 w-3 not-italic" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
