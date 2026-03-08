'use client'

import Link from 'next/link'
import { Menu, Search, Heart, ShoppingBag, User } from 'lucide-react'
import AdminAuthDropdown from './admin/AdminAuthDropdown'

interface ChameleonHeaderProps {
  onMenuClick?: () => void
}

export function ChameleonHeader({ onMenuClick }: ChameleonHeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-[100] pointer-events-none" suppressHydrationWarning>
      {/* Main navigation with mix-blend-difference for automatic contrast */}
      <div 
        className="flex justify-between items-center w-full px-6 py-4 mix-blend-difference text-white pointer-events-auto"
        suppressHydrationWarning
      >
        {/* Left: Hamburger */}
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

        {/* Center: Logo */}
        <Link href="/" className="text-center group" suppressHydrationWarning>
          <span className="font-serif text-2xl tracking-widest uppercase block leading-tight">
            MAREBO :)
          </span>
          <span className="text-[10px] tracking-widest uppercase block">
            MARÍA MARÍN REBOLOSO
          </span>
        </Link>

        {/* Right: Icons (Search, Heart, ShoppingBag, User) */}
        <div className="flex items-center gap-6" suppressHydrationWarning>
          <button
            className="hover:opacity-60 transition-opacity hidden md:flex items-center justify-center"
            aria-label="Buscar"
            suppressHydrationWarning
          >
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button
            className="hover:opacity-60 transition-opacity hidden md:flex items-center justify-center"
            aria-label="Lista de deseos"
            suppressHydrationWarning
          >
            <Heart className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <Link
            href="/carrito"
            className="hover:opacity-60 transition-opacity flex items-center justify-center"
            aria-label="Carrito"
            suppressHydrationWarning
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          
          {/* User Icon - part of the blend effect */}
          <div className="flex items-center justify-center" suppressHydrationWarning>
            <AdminAuthDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}
