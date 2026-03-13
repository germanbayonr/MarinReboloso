'use client'

import Link from 'next/link'
import { Menu, Search, Heart, ShoppingBag, User } from 'lucide-react'
import AdminAuthDropdown from './admin/AdminAuthDropdown'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import SearchOverlay from '@/components/SearchOverlay'

interface ChameleonHeaderProps {
  onMenuClick?: () => void
}

export function ChameleonHeader({ onMenuClick }: ChameleonHeaderProps) {
  const { totalCount } = useCart()
  const { items } = useWishlist()
  const wishlistCount = items.length
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 mix-blend-difference pointer-events-none" suppressHydrationWarning>
      {/* Main navigation container - must be pure white text to work with difference blend mode */}
      <div 
        className="flex justify-between items-center w-full px-6 py-4 text-white"
        suppressHydrationWarning
      >
        {/* Left: Hamburger and Logo */}
        <div className="flex items-center gap-4 pointer-events-auto" suppressHydrationWarning>
          <div className="flex items-center justify-center w-10 h-10" suppressHydrationWarning>
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center hover:opacity-60 transition-opacity"
              aria-label="Menu"
              suppressHydrationWarning
            >
              <Menu className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>

          {/* Logo next to Hamburger */}
          <Link href="/" className="group" suppressHydrationWarning>
            <span className="font-serif text-2xl tracking-widest uppercase block leading-tight">
              MAREBO JEWELRY
            </span>
            <span className="text-[10px] tracking-widest uppercase block">
              MARÍA MARÍN REBOLOSO
            </span>
          </Link>
        </div>

        {/* Right: Icons (Search, Heart, ShoppingBag, User) */}
        <div className="flex items-center gap-6 pointer-events-auto" suppressHydrationWarning>
          <button
            className="hover:opacity-60 transition-opacity flex items-center justify-center"
            aria-label="Buscar"
            onClick={() => setIsSearchOpen(true)}
            suppressHydrationWarning
          >
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <Link
            href="/wishlist"
            className="hover:opacity-60 transition-opacity hidden md:flex items-center justify-center relative"
            aria-label="Wishlist"
            suppressHydrationWarning
          >
            <Heart className="w-5 h-5" strokeWidth={1.5} />
            <AnimatePresence>
              {wishlistCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  key={wishlistCount}
                  className="absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center mix-blend-normal"
                >
                  <motion.span
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {wishlistCount}
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <Link
            href="/carrito"
            id="cart-icon-target" // ID para el cálculo de la animación
            className="hover:opacity-60 transition-opacity flex items-center justify-center relative"
            aria-label="Carrito"
            suppressHydrationWarning
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            <AnimatePresence>
              {totalCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  key={totalCount}
                  className="absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center mix-blend-normal"
                >
                  <motion.span
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {totalCount}
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          
          {/* User Icon */}
          <div className="flex items-center justify-center" suppressHydrationWarning>
            <AdminAuthDropdown />
          </div>
        </div>
      </div>
      </header>

      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
