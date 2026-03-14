'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  collection: string | null
  is_new_arrival: boolean
  stripe_product_id: string | null
  stripe_price_id: string | null
}

interface ProductsContextType {
  products: Product[]
  hydrated: boolean
  refresh: () => Promise<void>
  getByName: (name: string) => Product | null
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

const ProductsContext = createContext<ProductsContextType | null>(null)

function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalizeName(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function mapRow(row: any): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: row.description ?? null,
    price: toNumber(row.price),
    image_url: row.image_url ?? null,
    category: row.category ?? null,
    collection: row.collection ?? null,
    is_new_arrival: Boolean(row.is_new_arrival),
    stripe_product_id: row.stripe_product_id ?? null,
    stripe_price_id: row.stripe_price_id ?? null,
  }
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [hydrated, setHydrated] = useState(false)

  const productsByName = useMemo(() => {
    const map = new Map<string, Product>()
    const duplicates = new Set<string>()

    for (const p of products) {
      const key = normalizeName(p.name)
      if (!key) continue
      if (map.has(key)) duplicates.add(key)
      else map.set(key, p)
    }

    for (const key of duplicates) map.delete(key)
    return map
  }, [products])

  const getByName = useCallback(
    (name: string) => {
      const key = normalizeName(name)
      if (!key) return null
      return productsByName.get(key) ?? null
    },
    [productsByName],
  )

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,description,price,image_url,category,collection,is_new_arrival,stripe_product_id,stripe_price_id')
      .order('name', { ascending: true })
      .limit(5000)

    if (error) {
      setProducts([])
      setHydrated(true)
      return
    }

    setProducts((data ?? []).map(mapRow))
    setHydrated(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await refresh()
    }
    run()
    return () => {
      cancelled = true
      void cancelled
    }
  }, [refresh])

  const addProduct = useCallback(
    async (product: Omit<Product, 'id'>) => {
      const payload = {
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        is_new_arrival: product.is_new_arrival,
        stripe_product_id: product.stripe_product_id,
        stripe_price_id: product.stripe_price_id,
      }
      const { error } = await supabase.from('products').insert([payload])
      if (!error) await refresh()
    },
    [refresh],
  )

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Omit<Product, 'id'>>) => {
      const payload: any = {}
      if (updates.name !== undefined) payload.name = updates.name
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.price !== undefined) payload.price = updates.price
      if (updates.image_url !== undefined) payload.image_url = updates.image_url
      if (updates.category !== undefined) payload.category = updates.category
      if (updates.is_new_arrival !== undefined) payload.is_new_arrival = updates.is_new_arrival
      if (updates.stripe_product_id !== undefined) payload.stripe_product_id = updates.stripe_product_id
      if (updates.stripe_price_id !== undefined) payload.stripe_price_id = updates.stripe_price_id

      if (Object.keys(payload).length === 0) return
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      if (!error) await refresh()
    },
    [refresh],
  )

  const deleteProduct = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (!error) await refresh()
    },
    [refresh],
  )

  const value = useMemo(
    () => ({ products, hydrated, refresh, getByName, addProduct, updateProduct, deleteProduct }),
    [products, hydrated, refresh, getByName, addProduct, updateProduct, deleteProduct],
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider')
  return ctx
}
