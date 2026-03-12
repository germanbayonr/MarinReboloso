'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  variant?: string
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

const STORAGE_KEY = 'marebo_cart_v1'

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
    })
  }

  return out
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setHydrated(true)
        return
      }
      const parsed = JSON.parse(raw)
      setCartItems(normalizeCart(parsed))
    } catch {
      setCartItems([])
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
    } catch {}
  }, [cartItems, hydrated])

  const addToCart = useCallback((newItem: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === newItem.id && item.variant === newItem.variant)
      if (existing) {
        return prev.map(item => 
          item.id === newItem.id && item.variant === newItem.variant 
            ? { ...item, quantity: item.quantity + Math.max(1, newItem.quantity || 1) } 
            : item
        )
      }
      return [...prev, newItem]
    })
  }, [])

  const removeFromCart = useCallback((id: string, variant?: string) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.variant === variant)))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number, variant?: string) => {
    const nextQty = Math.floor(quantity)

    setCartItems(prev => {
      if (nextQty <= 0) {
        return prev.filter(item => !(item.id === id && item.variant === variant))
      }
      return prev.map(item => (item.id === id && item.variant === variant ? { ...item, quantity: nextQty } : item))
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
