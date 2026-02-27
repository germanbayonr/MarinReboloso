'use client'

import { Search, ShoppingBag, Heart, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const shopCategories = [
  { label: 'Pendientes', href: '/shop/pendientes' },
  { label: 'Mantones', href: '/shop/mantones' },
  { label: 'Trajes', href: '/shop/trajes' },
  { label: 'Accesorios', href: '/shop/accesorios' },
  { label: 'Cinturones', href: '/shop/cinturones' },
  { label: 'Chokers', href: '/shop/chokers' },
  { label: 'Peinecillos', href: '/shop/peinecillos' },
]

const collections = [
  { label: 'Isabelita', href: '/shop/isabelita' },
  { label: 'Vintage', href: '/shop/vintage' },
  { label: 'Esencial', href: '/shop/esencial' },
  { label: 'Lost in Jaipur', href: '/shop/lost-in-jaipur', accent: true },
]

function DesktopDropdown({ label, items }: { label: string; items: { label: string; href: string; accent?: boolean }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 text-xs tracking-widest uppercase font-sans text-foreground/70 hover:text-foreground transition-colors py-2"
        suppressHydrationWarning
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-0 bg-background border border-border shadow-lg min-w-[180px] z-50 py-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-5 py-2.5 text-sm hover:bg-secondary/40 transition-colors ${item.accent ? 'italic text-accent' : 'text-foreground/80'}`}
              onClick={() => setOpen(false)}
              suppressHydrationWarning
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [cartCount] = useState(0)

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50" suppressHydrationWarning>
      <div className="flex h-16 items-center px-4 md:px-8" suppressHydrationWarning>

        {/* Left: Mobile menu icon + Brand */}
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="flex items-center justify-center hover:text-accent transition-colors"
                  aria-label="Abrir menú"
                  suppressHydrationWarning
                >
                  <Image
                    src="/images/wayfar-icon.svg"
                    alt="Menú"
                    width={22}
                    height={22}
                  />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <NavigationDrawer />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: icon + brand name */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" suppressHydrationWarning>
            <Image
              src="/images/wayfar-icon.svg"
              alt="Wayfar Brand"
              width={22}
              height={22}
            />
            <span className="font-serif text-sm md:text-base tracking-[0.18em] uppercase">
              WAYFAR BRAND
            </span>
          </Link>
        </div>

        {/* Center: Desktop navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Navegación principal">
          <DesktopDropdown label="Collections" items={collections} />
          <DesktopDropdown label="Shop" items={shopCategories} />
          <Link
            href="/novedades"
            className="text-xs tracking-widest uppercase font-sans text-foreground/70 hover:text-foreground transition-colors py-2"
            suppressHydrationWarning
          >
            Novedades
          </Link>
          <Link
            href="/nuestra-historia"
            className="text-xs tracking-widest uppercase font-sans text-foreground/70 hover:text-foreground transition-colors py-2"
            suppressHydrationWarning
          >
            Nuestra Historia
          </Link>
        </nav>

        {/* Right: Icons */}
        <div className="flex items-center gap-4 md:gap-5 flex-1 justify-end">
          <button
            className="hover:text-accent transition-colors"
            aria-label="Buscar"
            suppressHydrationWarning
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <button
            className="hover:text-accent transition-colors hidden md:block"
            aria-label="Lista de deseos"
            suppressHydrationWarning
          >
            <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <Link href="/carrito" className="relative hover:text-accent transition-colors" aria-label="Carrito de compras" suppressHydrationWarning>
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  )
}

function NavigationDrawer() {
  const [openShop, setOpenShop] = useState(false)
  const [openColecciones, setOpenColecciones] = useState(false)

  return (
    <nav className="flex h-full flex-col" suppressHydrationWarning>
      <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">

        {/* SHOP */}
        <Collapsible open={openShop} onOpenChange={setOpenShop}>
          <CollapsibleTrigger
            className="flex w-full items-center justify-between font-serif text-lg tracking-wider uppercase hover:text-accent transition-colors"
            suppressHydrationWarning
          >
            Shop
            <span className="text-sm font-sans">{openShop ? '−' : '+'}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-1 pl-4">
            {shopCategories.map((cat) => (
              <Link key={cat.href} href={cat.href} className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" suppressHydrationWarning>
                {cat.label}
              </Link>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* COLECCIONES */}
        <Collapsible open={openColecciones} onOpenChange={setOpenColecciones}>
          <CollapsibleTrigger
            className="flex w-full items-center justify-between font-serif text-lg tracking-wider uppercase hover:text-accent transition-colors"
            suppressHydrationWarning
          >
            Collections
            <span className="text-sm font-sans">{openColecciones ? '−' : '+'}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-1 pl-4">
            {collections.map((col) => (
              <Link key={col.href} href={col.href} className={`block py-1.5 text-sm transition-colors ${col.accent ? 'italic text-accent hover:text-accent/80' : 'text-muted-foreground hover:text-foreground'}`} suppressHydrationWarning>
                {col.label}
              </Link>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Link href="/novedades" className="block font-serif text-lg tracking-wider uppercase hover:text-accent transition-colors" suppressHydrationWarning>
          Novedades
        </Link>
        <Link href="/nuestra-historia" className="block font-serif text-lg tracking-wider uppercase hover:text-accent transition-colors" suppressHydrationWarning>
          Nuestra Historia
        </Link>
      </div>

      <div className="border-t border-border px-6 py-6 space-y-4">
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Ayuda</a>
          <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
          <a href="#" className="hover:text-foreground transition-colors">Envíos</a>
        </div>
      </div>
    </nav>
  )
}
