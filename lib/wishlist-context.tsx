'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type WishlistItem = {
  id: string
  name: string
  price: number
  image: string
  href: string
}

type WishlistContextValue = {
  items: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: string) => void
  isInWishlist: (id: string) => boolean
}

const STORAGE_KEY = 'marebo_wishlist_v1'

const WishlistContext = createContext<WishlistContextValue | null>(null)

function normalizeItems(value: unknown): WishlistItem[] {
  if (!Array.isArray(value)) return []

  const out: WishlistItem[] = []
  const seen = new Set<string>()

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Partial<WishlistItem>
    if (!item.id || !item.name || typeof item.price !== 'number' || !item.image || !item.href) continue
    if (seen.has(item.id)) continue
    seen.add(item.id)

    const id = String(item.id)
    const href = String(item.href).startsWith('/shop/') ? `/producto/${id}` : String(item.href)
    out.push({ id, name: String(item.name), price: item.price, image: String(item.image), href })
  }

  return out
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setHydrated(true)
        return
      }
      const parsed = JSON.parse(raw)
      setItems(normalizeItems(parsed))
    } catch {
      setItems([])
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, hydrated])

  useEffect(() => {
    if (!hydrated) return
    const ids = Array.from(new Set(items.map((i) => i.id).filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))))
    if (ids.length === 0) return

    let cancelled = false
    const run = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price')
        .eq('is_active', true)
        .in('id', ids)
      if (cancelled) return
      if (error) return

      const map = new Map(
        (data ?? []).map((r: any) => [
          String(r.id),
          {
            name: String(r.name ?? ''),
            price: typeof r.price === 'number' ? r.price : Number(r.price),
          },
        ]),
      )

      setItems((prev) => {
        let changed = false
        const next = prev.map((item) => {
          const next = map.get(item.id)
          if (!next) return item
          const nextPrice = Number.isFinite(next.price) ? next.price : item.price
          const nextName = next.name ? next.name : item.name
          if (nextPrice === item.price && nextName === item.name) return item
          changed = true
          return { ...item, price: nextPrice, name: nextName }
        })
        return changed ? next : prev
      })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [hydrated, items])

  const addToWishlist = useCallback((item: WishlistItem) => {
    setItems(prev => {
      if (prev.some(p => p.id === item.id)) return prev
      return [item, ...prev]
    })
  }, [])

  const removeFromWishlist = useCallback((id: string) => {
    setItems(prev => prev.filter(p => p.id !== id))
  }, [])

  const ids = useMemo(() => new Set(items.map(i => i.id)), [items])

  const isInWishlist = useCallback((id: string) => ids.has(id), [ids])

  const value: WishlistContextValue = useMemo(
    () => ({ items, addToWishlist, removeFromWishlist, isInWishlist }),
    [items, addToWishlist, removeFromWishlist, isInWishlist],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
