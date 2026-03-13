'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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
