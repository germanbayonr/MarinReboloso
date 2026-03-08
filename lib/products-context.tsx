'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Product {
  id: string
  name: string
  price: number
  sku: string
  stock: number
  status: 'published' | 'draft'
  category: string
  collection: string
  images: string[]
  createdAt: string
}

interface ProductsContextType {
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
}

const STORAGE_KEY = 'marebo_products'

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Pendientes Lágrima de Coral',
    price: 65,
    sku: 'PLC-001',
    stock: 12,
    status: 'published',
    category: 'pendientes',
    collection: 'Isabelita',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.11.56-zUBf6AVI60OR1IP9eKrL6OssGO6rBG.png'],
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    name: 'Pendientes Ecos de Coral',
    price: 85,
    sku: 'PEC-002',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Isabelita',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.20-cRopWnepHqb9VHcOac4FBhlylj8kRM.png'],
    createdAt: '2025-01-12',
  },
  {
    id: '3',
    name: 'Pendientes Aura Coralina',
    price: 75,
    sku: 'PAC-003',
    stock: 5,
    status: 'published',
    category: 'pendientes',
    collection: 'Lost in Jaipur',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.36-jaaMU2a9rSJZQeTG3pZJfyeJjKoAq8.png'],
    createdAt: '2025-01-15',
  },
  {
    id: '4',
    name: 'Pendientes Lágrimas Coralinas',
    price: 70,
    sku: 'PLC-004',
    stock: 10,
    status: 'published',
    category: 'pendientes',
    collection: 'Esencial',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.42-enCDb88evdf3gttzdniN8r7Cl0ce9e.png'],
    createdAt: '2025-01-18',
  },
  {
    id: '5',
    name: 'Pendientes Pastora',
    price: 80,
    sku: 'PP-005',
    stock: 7,
    status: 'published',
    category: 'pendientes',
    collection: 'Vintage',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20pantalla%202026-02-26%20a%20las%2019.12.48-gIbpgLH2xr5vmaScX2HS0V8yLl8zyB.png'],
    createdAt: '2025-01-20',
  },
  {
    id: '6',
    name: 'Pendientes Coralia Salmón',
    price: 72,
    sku: 'PCS-006',
    stock: 9,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Pendientes%20Coralia%20Salmon-bMO9inuiJch1MimA6KyiqgxbgjgeVG.jpg'],
    createdAt: '2025-02-01',
  },
  {
    id: '7',
    name: 'Pendientes Coralia Sky',
    price: 72,
    sku: 'PCK-007',
    stock: 6,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Pendientes%20Coralia%20Sky%281%29.JPG-RuveMQFyKIVt9x5EbeTNRIO2BvE69K.jpeg'],
    createdAt: '2025-02-01',
  },
  {
    id: '8',
    name: 'Pendientes Linaje Carmesí',
    price: 110,
    sku: 'PLC-008',
    stock: 4,
    status: 'published',
    category: 'pendientes',
    collection: 'Vintage',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Pendientes%20Linaje%20Carmesi%CC%81-fTpwDcNLc2qjRXt3MZzswKekCdBGaA.jpg'],
    createdAt: '2025-02-05',
  },
  {
    id: '9',
    name: 'Collar Filipa',
    price: 145,
    sku: 'CF-009',
    stock: 3,
    status: 'published',
    category: 'accesorios',
    collection: 'Isabelita',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Collar%20Filipa.PNG-gP7GoFyDaZhK7vZjmAY58RnY3Ej1go.png'],
    createdAt: '2025-02-08',
  },
  {
    id: '10',
    name: 'Bolso Carmesí Bordé',
    price: 195,
    sku: 'BCB-010',
    stock: 5,
    status: 'published',
    category: 'accesorios',
    collection: 'Vintage',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Bolso%20Carmesi%CC%81%20Borde%CC%81.PNG-bKe2PaB1h1z8DlvQGbOI5H9mrTB0On.png'],
    createdAt: '2025-02-10',
  },
  {
    id: '11',
    name: 'Bolso Oriental Noir',
    price: 195,
    sku: 'BON-011',
    stock: 4,
    status: 'published',
    category: 'accesorios',
    collection: 'Lost in Jaipur',
    images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Bolso%20Oriental%20Noir.PNG-OYHQVS1JIOYboqGoUDvLkfWw5D4Z66.png'],
    createdAt: '2025-02-10',
  },
]

const ProductsContext = createContext<ProductsContextType | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount; seed with INITIAL_PRODUCTS if empty
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setProducts(JSON.parse(stored))
      } else {
        setProducts(INITIAL_PRODUCTS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS))
      }
    } catch {
      setProducts(INITIAL_PRODUCTS)
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever products change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, [products, hydrated])

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
    }
    setProducts(prev => [newProduct, ...prev])
  }

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider')
  return ctx
}
