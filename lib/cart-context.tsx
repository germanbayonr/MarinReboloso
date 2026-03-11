'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface CartItem {
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
  totalCount: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === newItem.id && item.variant === newItem.variant)
      if (existing) {
        return prev.map(item => 
          item.id === newItem.id && item.variant === newItem.variant 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      }
      return [...prev, newItem]
    })
  }

  const totalCount = cartItems.reduce((acc, item) => item.quantity + acc, 0)

  return (
    <CartContext.Provider value={{ cartItems, addToCart, totalCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
