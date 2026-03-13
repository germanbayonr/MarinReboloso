'use client'

import { ChevronDown, X, Instagram } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChameleonHeader } from '@/components/ChameleonHeader'

const NAV_COLLECTIONS = [
  { label: 'Descará', href: '/coleccion/descara', isNew: true },
  { label: 'Marebo', href: '/coleccion/marebo' },
  { label: 'Corales', href: '/coleccion/corales' },
  { label: 'Filipa', href: '/coleccion/filipa' },
  { label: 'Jaipur', href: '/coleccion/jaipur' },
]

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* CHAMELEON HEADER - Auto-contrast logo and icons */}
      <ChameleonHeader onMenuClick={() => setDrawerOpen(true)} />

      {/* Off-canvas Drawer */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-sm z-[70] bg-background flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menú de navegación"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-border/50 flex-shrink-0">
          <span className="font-serif text-sm tracking-[0.2em] uppercase">Menú</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="hover:opacity-60 transition-opacity"
            aria-label="Cerrar menú"
            suppressHydrationWarning
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Drawer Links */}
        <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-1" aria-label="Navegación lateral">

          {/* COLECCIONES accordion */}
          <div>
            <button
              onClick={() => setCollectionsOpen(v => !v)}
              className="flex w-full items-center justify-between py-3 font-serif text-base tracking-widest uppercase hover:text-accent transition-colors"
              suppressHydrationWarning
            >
              Colecciones
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${collectionsOpen ? 'rotate-180' : ''}`}
                strokeWidth={1.5}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${collectionsOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="pl-4 pb-2 space-y-0.5">
                {NAV_COLLECTIONS.map(col => (
                  <Link
                    key={col.href}
                    href={col.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-2 py-2 text-sm italic text-muted-foreground hover:text-foreground transition-colors"
                    suppressHydrationWarning
                  >
                    {col.label}
                    {col.isNew && (
                      <span className="text-[8px] tracking-widest uppercase px-1 py-0.5 border border-[#d4c5b9] text-[#d4c5b9] not-italic leading-none">
                        nueva
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/catalogo"
            onClick={() => setDrawerOpen(false)}
            className="block py-3 font-serif text-base tracking-widest uppercase hover:text-accent transition-colors"
            suppressHydrationWarning
          >
            Novedades
          </Link>
          <Link
            href="/nuestra-historia"
            onClick={() => setDrawerOpen(false)}
            className="block py-3 font-serif text-base tracking-widest uppercase hover:text-accent transition-colors"
            suppressHydrationWarning
          >
            Nuestra Historia
          </Link>
        </nav>

        {/* Drawer Footer */}
        <div className="px-6 py-6 border-t border-border/50 flex-shrink-0">
          <a
            href="https://instagram.com/marebojewelry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            suppressHydrationWarning
          >
            <Instagram className="h-4 w-4" strokeWidth={1.5} />
            @marebojewelry
          </a>
        </div>
      </aside>
    </>
  )
}
