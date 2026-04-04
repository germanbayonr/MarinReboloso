'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import {
  CART_LEGACY_LOCAL_KEY,
  CART_SESSION_KEY,
  cartStorageKeyForUser,
  isProductUuid,
} from '@/lib/shop-client-storage'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  variant?: string
  stripe_price_id?: string | null
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string, variant?: string) => void
  updateQuantity: (id: string, quantity: number, variant?: string) => void
  clearCart: () => void
  totalCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextType | null>(null)

function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []

  const out: CartItem[] = []
  const seen = new Set<string>()

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Partial<CartItem>

    if (!item.id || !item.name || typeof item.price !== 'number' || !item.image || typeof item.quantity !== 'number') continue
    if (item.quantity <= 0) continue

    const id = String(item.id)
    const variant = item.variant ? String(item.variant) : undefined
    const key = `${id}__${variant ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)

    out.push({
      id,
      name: String(item.name),
      price: item.price,
      image: String(item.image),
      quantity: Math.floor(item.quantity),
      variant,
      stripe_price_id: item.stripe_price_id ? String(item.stripe_price_id) : null,
    })
  }

  return out
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const prevUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (authLoading) return

    const prev = prevUserIdRef.current
    const uid = user?.id

    if (prev && !uid) {
      try {
        sessionStorage.removeItem(CART_SESSION_KEY)
      } catch {}
    }
    prevUserIdRef.current = uid

    try {
      if (!uid) {
        try {
          localStorage.removeItem(CART_LEGACY_LOCAL_KEY)
        } catch {}
        const raw = sessionStorage.getItem(CART_SESSION_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          setCartItems(normalizeCart(parsed).filter((i) => isProductUuid(i.id)))
        } else {
          setCartItems([])
        }
      } else {
        const raw = localStorage.getItem(cartStorageKeyForUser(uid))
        if (raw) {
          const parsed = JSON.parse(raw)
          setCartItems(normalizeCart(parsed).filter((i) => isProductUuid(i.id)))
        } else {
          setCartItems([])
        }
      }
    } catch {
      setCartItems([])
    } finally {
      setHydrated(true)
    }
  }, [authLoading, user?.id])

  useEffect(() => {
    if (!hydrated || authLoading) return
    try {
      if (user?.id) {
        localStorage.setItem(cartStorageKeyForUser(user.id), JSON.stringify(cartItems))
      } else {
        sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(cartItems))
      }
    } catch {}
  }, [cartItems, hydrated, authLoading, user?.id])

  const cartIdsKey = useMemo(
    () =>
      [...new Set(cartItems.map((i) => i.id).filter(isProductUuid))]
        .sort()
        .join(','),
    [cartItems],
  )

  useEffect(() => {
    if (!hydrated || authLoading) return

    if (!cartIdsKey) {
      setCartItems((prev) => {
        const next = prev.filter((i) => isProductUuid(i.id))
        return next.length === prev.length ? prev : next
      })
      return
    }

    const ids = cartIdsKey.split(',').filter(Boolean)
    let cancelled = false

    const run = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,stripe_price_id')
        .eq('is_active', true)
        .in('id', ids)
      if (cancelled || error) return

      const map = new Map(
        (data ?? []).map((r: { id: string; name?: string; price?: unknown; stripe_price_id?: string | null }) => [
          String(r.id),
          {
            name: String(r.name ?? ''),
            price: typeof r.price === 'number' ? r.price : Number(r.price),
            stripe_price_id: r.stripe_price_id ? String(r.stripe_price_id) : null,
          },
        ]),
      )

      setCartItems((prev) => {
        const next = prev.filter((item) => isProductUuid(item.id) && map.has(item.id))
        return next.map((item) => {
          const row = map.get(item.id)!
          const nextPrice = Number.isFinite(row.price) ? row.price : item.price
          const nextName = row.name ? row.name : item.name
          const nextStripe = row.stripe_price_id ?? item.stripe_price_id ?? null
          if (nextPrice === item.price && nextName === item.name && nextStripe === item.stripe_price_id) {
            return item
          }
          return { ...item, price: nextPrice, name: nextName, stripe_price_id: nextStripe }
        })
      })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [cartIdsKey, hydrated, authLoading])

  const addToCart = useCallback((newItem: CartItem) => {
    if (!isProductUuid(newItem.id)) return
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id && item.variant === newItem.variant)
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id && item.variant === newItem.variant
            ? {
                ...item,
                quantity: item.quantity + Math.max(1, newItem.quantity || 1),
                stripe_price_id: item.stripe_price_id ?? newItem.stripe_price_id ?? null,
              }
            : item,
        )
      }
      return [...prev, newItem]
    })
  }, [])

  const removeFromCart = useCallback((id: string, variant?: string) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && item.variant === variant)))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number, variant?: string) => {
    const nextQty = Math.floor(quantity)

    setCartItems((prev) => {
      if (nextQty <= 0) {
        return prev.filter((item) => !(item.id === id && item.variant === variant))
      }
      return prev.map((item) => (item.id === id && item.variant === variant ? { ...item, quantity: nextQty } : item))
    })
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const totalCount = useMemo(() => cartItems.reduce((acc, item) => item.quantity + acc, 0), [cartItems])
  const cartTotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems])

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
