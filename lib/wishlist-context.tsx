'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import {
  isProductUuid,
  WISHLIST_LEGACY_LOCAL_KEY,
  WISHLIST_SESSION_KEY,
  wishlistStorageKeyForUser,
} from '@/lib/shop-client-storage'

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
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const prevUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (authLoading) return

    const prev = prevUserIdRef.current
    const uid = user?.id

    if (prev && !uid) {
      try {
        sessionStorage.removeItem(WISHLIST_SESSION_KEY)
      } catch {}
    }
    prevUserIdRef.current = uid

    try {
      if (!uid) {
        try {
          localStorage.removeItem(WISHLIST_LEGACY_LOCAL_KEY)
        } catch {}
        const raw = sessionStorage.getItem(WISHLIST_SESSION_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          setItems(normalizeItems(parsed).filter((i) => isProductUuid(i.id)))
        } else {
          setItems([])
        }
      } else {
        const raw = localStorage.getItem(wishlistStorageKeyForUser(uid))
        if (raw) {
          const parsed = JSON.parse(raw)
          setItems(normalizeItems(parsed).filter((i) => isProductUuid(i.id)))
        } else {
          setItems([])
        }
      }
    } catch {
      setItems([])
    } finally {
      setHydrated(true)
    }
  }, [authLoading, user?.id])

  useEffect(() => {
    if (!hydrated || authLoading) return
    try {
      if (user?.id) {
        localStorage.setItem(wishlistStorageKeyForUser(user.id), JSON.stringify(items))
      } else {
        sessionStorage.setItem(WISHLIST_SESSION_KEY, JSON.stringify(items))
      }
    } catch {}
  }, [items, hydrated, authLoading, user?.id])

  const wishlistIdsKey = useMemo(
    () =>
      [...new Set(items.map((i) => i.id).filter(isProductUuid))]
        .sort()
        .join(','),
    [items],
  )

  useEffect(() => {
    if (!hydrated || authLoading) return

    if (!wishlistIdsKey) {
      setItems((prev) => {
        const next = prev.filter((i) => isProductUuid(i.id))
        return next.length === prev.length ? prev : next
      })
      return
    }

    const ids = wishlistIdsKey.split(',').filter(Boolean)
    let cancelled = false

    const run = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price')
        .eq('is_active', true)
        .in('id', ids)
      if (cancelled || error) return

      const map = new Map(
        (data ?? []).map((r: { id: string; name?: string; price?: unknown }) => [
          String(r.id),
          {
            name: String(r.name ?? ''),
            price: typeof r.price === 'number' ? r.price : Number(r.price),
          },
        ]),
      )

      setItems((prev) => {
        const kept = prev.filter((item) => isProductUuid(item.id) && map.has(item.id))
        return kept.map((item) => {
          const row = map.get(item.id)!
          const nextPrice = Number.isFinite(row.price) ? row.price : item.price
          const nextName = row.name ? row.name : item.name
          if (nextPrice === item.price && nextName === item.name) return item
          return { ...item, price: nextPrice, name: nextName }
        })
      })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [wishlistIdsKey, hydrated, authLoading])

  const addToWishlist = useCallback((item: WishlistItem) => {
    if (!isProductUuid(item.id)) return
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev
      return [item, ...prev]
    })
  }, [])

  const removeFromWishlist = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const ids = useMemo(() => new Set(items.map((i) => i.id)), [items])

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
