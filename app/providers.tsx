'use client'

import { AuthProvider } from '@/lib/auth-context'
import { ProductsProvider } from '@/lib/products-context'
import { CartProvider } from '@/lib/cart-context'
import { WishlistProvider } from '@/lib/wishlist-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProductsProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </ProductsProvider>
    </AuthProvider>
  )
}

