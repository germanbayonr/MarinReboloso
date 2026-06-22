'use client'

import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { SiteCatalogProvider } from '@/lib/site-catalog-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteCatalogProvider>
        <WishlistProvider>
          <CartProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </CartProvider>
        </WishlistProvider>
      </SiteCatalogProvider>
    </AuthProvider>
  )
}
