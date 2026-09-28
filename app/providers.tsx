'use client'

import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { SiteCatalogProvider } from '@/lib/site-catalog-context'

function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <SiteCatalogProvider>
      <WishlistProvider>
        <CartProvider>{children}</CartProvider>
      </WishlistProvider>
    </SiteCatalogProvider>
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin') ?? false

  return (
    <AuthProvider>
      {isAdmin ? (
        <>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </>
      ) : (
        <StoreProviders>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </StoreProviders>
      )}
    </AuthProvider>
  )
}
