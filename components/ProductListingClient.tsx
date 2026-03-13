'use client'

import { useState, useMemo } from 'react'
import { Filter, ChevronDown } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { InteractiveCard } from '@/components/InteractiveCard'

// ──────────────────────────────────────────────────────────────────────────────
// Product data
// ──────────────────────────────────────────────────────────────────────────────

const mockProducts = {
  pendientes: [
    {
      id: 1,
      name: 'Pendientes Lágrima de Coral',
      collection: 'Isabelita',
      price: 35,
      size: null,
      images: [
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.03-xc6rqiEEQMufTwrn7e79sUQXfR8Gev.png',
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.11.56-zUBf6AVI60OR1IP9eKrL6OssGO6rBG.png',
      ],
    },
    {
      id: 2,
      name: 'Pendientes Ecos de Coral',
      collection: 'Isabelita',
      price: 42,
      size: null,
      images: [
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.13-VNCBE2d9HXZVxGPLSx6geOrLtPpMvV.png',
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.20-cRopWnepHqb9VHcOac4FBhlylj8kRM.png',
      ],
    },
    {
      id: 3,
      name: 'Pendientes Aura Coralina',
      collection: 'Vintage',
      price: 38,
      size: null,
      images: [
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.29-luRtneHGJ1h9y812DbZhnYUB38ZBJe.png',
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.36-jaaMU2a9rSJZQeTG3pZJfyeJjKoAq8.png',
      ],
    },
    {
      id: 4,
      name: 'Pendientes Lágrimas Coralinas',
      collection: 'Esencial',
      price: 32,
      size: null,
      images: [
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.42-enCDb88evdf3gttzdniN8r7Cl0ce9e.png',
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.48-gIbpgLH2xr5vmaScX2HS0V8yLl8zyB.png',
      ],
    },
    {
      id: 5,
      name: 'Pendientes Pastora',
      collection: 'Vintage',
      price: 45,
      size: null,
      images: [
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.53-OQ3u5pZHceI43oILO79fkVgeHPSO8M.png',
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.36-jaaMU2a9rSJZQeTG3pZJfyeJjKoAq8.png',
      ],
    },
  ],
  mantones: [
    { id: 10, name: 'Mantón Seda Negro', collection: 'Esencial', price: 250, size: 'Único', images: ['/images/manton-seda-negro.jpg'] },
    { id: 11, name: 'Mantón Bordado Crema', collection: 'Isabelita', price: 280, size: 'Único', images: ['/images/manton-seda-negro.jpg'] },
  ],
  trajes: [
    { id: 20, name: 'Traje Lino Beige', collection: 'Esencial', price: 180, size: 'S-XL', images: ['/images/traje-lino-beige.jpg'] },
    { id: 21, name: 'Vestido Invitada', collection: 'Isabelita', price: 150, size: 'S-XL', images: ['/images/vestido-invitada.jpg'] },
  ],
  accesorios: [
    { id: 30, name: 'Choker Dorado', collection: 'Esencial', price: 18, size: null, images: ['/images/choker-dorado.jpg'] },
  ],
  cinturones: [],
  chokers: [
    { id: 30, name: 'Choker Dorado', collection: 'Esencial', price: 18, size: null, images: ['/images/choker-dorado.jpg'] },
  ],
  peinecillos: [],
  isabelita: [
    { id: 1, name: 'Pendientes Lágrima de Coral', collection: 'Isabelita', price: 35, size: null, images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.03-xc6rqiEEQMufTwrn7e79sUQXfR8Gev.png', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.11.56-zUBf6AVI60OR1IP9eKrL6OssGO6rBG.png'] },
    { id: 2, name: 'Pendientes Ecos de Coral', collection: 'Isabelita', price: 42, size: null, images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.13-VNCBE2d9HXZVxGPLSx6geOrLtPpMvV.png'] },
  ],
  vintage: [
    { id: 3, name: 'Pendientes Aura Coralina', collection: 'Vintage', price: 38, size: null, images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.29-luRtneHGJ1h9y812DbZhnYUB38ZBJe.png'] },
    { id: 5, name: 'Pendientes Pastora', collection: 'Vintage', price: 45, size: null, images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.53-OQ3u5pZHceI43oILO79fkVgeHPSO8M.png'] },
  ],
  esencial: [
    { id: 4, name: 'Pendientes Lágrimas Coralinas', collection: 'Esencial', price: 32, size: null, images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.42-enCDb88evdf3gttzdniN8r7Cl0ce9e.png'] },
    { id: 30, name: 'Choker Dorado', collection: 'Esencial', price: 18, size: null, images: ['/images/choker-dorado.jpg'] },
  ],
  'lost-in-jaipur': [
    { id: 2, name: 'Pendientes Ecos de Coral', collection: 'Lost in Jaipur', price: 42, size: null, images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.20-cRopWnepHqb9VHcOac4FBhlylj8kRM.png'] },
  ],
}

type Product = {
  id: number
  name: string
  collection: string
  price: number
  size: string | null
  images: string[]
}

const EMPTY_PRODUCTS: Product[] = []

const categoryTitles: Record<string, string> = {
  pendientes: 'Pendientes',
  mantones: 'Mantones',
  accesorios: 'Accesorios',
  peinecillos: 'Peinecillos',
  broches: 'Broches',
  pulseras: 'Pulseras',
  'descara': 'Colección Descará',
  'marebo': 'Colección Marebo',
  'corales': 'Colección Corales',
  'filipa': 'Colección Filipa',
  'jaipur': 'Lost in Jaipur',
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export default function ProductListingClient({ category }: { category: string }) {
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])

  const products = useMemo(
    () => (mockProducts[category as keyof typeof mockProducts] ?? EMPTY_PRODUCTS) as Product[],
    [category],
  )
  const title = categoryTitles[category] || category.charAt(0).toUpperCase() + category.slice(1)

  const collections = useMemo(() => Array.from(new Set(products.map(p => p.collection))), [products])
  const sizes = useMemo(() => {
    const all = products.map(p => p.size).filter(Boolean) as string[]
    return Array.from(new Set(all))
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCollections.length > 0 && !selectedCollections.includes(p.collection)) return false
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false
      if (selectedSizes.length > 0 && p.size && !selectedSizes.includes(p.size)) return false
      return true
    })
  }, [products, selectedCollections, priceRange, selectedSizes])

  const toggleCollection = (c: string) =>
    setSelectedCollections(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  const toggleSize = (s: string) =>
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const FilterContent = () => (
    <div className="space-y-8">
      {collections.length > 0 && (
        <div>
          <h3 className="font-serif text-sm mb-4 tracking-[0.15em] uppercase">Colección</h3>
          <div className="space-y-2.5">
            {collections.map(col => (
              <label key={col} className="flex items-center gap-2.5 cursor-pointer group/label">
                <input
                  type="checkbox"
                  checked={selectedCollections.includes(col)}
                  onChange={() => toggleCollection(col)}
                  className="w-3.5 h-3.5 accent-foreground"
                  suppressHydrationWarning
                />
                <span className="text-sm text-muted-foreground group-hover/label:text-foreground transition-colors">{col}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-serif text-sm mb-4 tracking-[0.15em] uppercase">Precio</h3>
        <div className="space-y-2.5">
          {[
            { label: 'Todos los precios', min: 0, max: 500 },
            { label: 'Menos de 50€', min: 0, max: 49 },
            { label: '50€ – 150€', min: 50, max: 150 },
            { label: 'Más de 150€', min: 151, max: 500 },
          ].map(opt => (
            <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer group/label">
              <input
                type="radio"
                name="price"
                checked={priceRange[0] === opt.min && priceRange[1] === opt.max}
                onChange={() => setPriceRange([opt.min, opt.max])}
                className="w-3.5 h-3.5 accent-foreground"
                suppressHydrationWarning
              />
              <span className="text-sm text-muted-foreground group-hover/label:text-foreground transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {sizes.length > 0 && (
        <div>
          <h3 className="font-serif text-sm mb-4 tracking-[0.15em] uppercase">Talla</h3>
          <div className="space-y-2.5">
            {sizes.map(size => (
              <label key={size} className="flex items-center gap-2.5 cursor-pointer group/label">
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={() => toggleSize(size)}
                  className="w-3.5 h-3.5 accent-foreground"
                  suppressHydrationWarning
                />
                <span className="text-sm text-muted-foreground group-hover/label:text-foreground transition-colors">{size}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {(selectedCollections.length > 0 || selectedSizes.length > 0 || priceRange[0] !== 0 || priceRange[1] !== 500) && (
        <button
          onClick={() => { setSelectedCollections([]); setSelectedSizes([]); setPriceRange([0, 500]) }}
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          suppressHydrationWarning
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background pt-32 lg:pt-40" suppressHydrationWarning>
      {/* Page header */}
      <div className="border-b border-border py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl tracking-wide">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{filteredProducts.length} productos</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12" suppressHydrationWarning>
        <div className="flex gap-12">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* Mobile filter FAB */}
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="bg-foreground text-background px-5 py-3 text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
                  suppressHydrationWarning
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-6">
                <SheetTitle className="font-serif text-xl tracking-wide mb-8">Filtros</SheetTitle>
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Product grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-muted-foreground text-sm">No se encontraron productos con estos filtros.</p>
              </div>
            ) : (
              <div className="columns-2 md:columns-3 gap-5">
                {filteredProducts.map(product => (
                  <div key={product.id} className="break-inside-avoid mb-6">
                    <InteractiveCard 
                      product={{
                        id: String(product.id),
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        collection: product.collection,
                      }}
                      href={`/producto/${product.id}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
