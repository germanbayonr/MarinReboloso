'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useProducts } from '@/lib/products-context'

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return

    setSearchTerm('')
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const raf = requestAnimationFrame(() => inputRef.current?.focus())
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return []
    return products
      .filter((p) => p.status === 'published' && p.name.toLowerCase().includes(term))
      .slice(0, 5)
  }, [products, searchTerm])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar búsqueda"
        className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center text-gray-900/70 hover:text-gray-900 transition-colors"
        suppressHydrationWarning
      >
        <X className="w-6 h-6" strokeWidth={1.5} />
      </button>

      <div className="w-full max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-32">
        <div className="border-b border-gray-200 focus-within:border-gray-900/60 transition-colors">
          <input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            autoFocus
            className="w-full bg-transparent py-6 font-serif text-4xl md:text-6xl text-gray-900 placeholder-gray-300 focus:outline-none"
          />
        </div>

        {!searchTerm.trim() ? (
          <div className="mt-12 text-sm text-gray-500 tracking-wide">Teclea para buscar...</div>
        ) : results.length === 0 ? (
          <div className="mt-12 text-sm text-gray-500 tracking-wide">Sin resultados.</div>
        ) : (
          <div className="flex flex-col space-y-4 mt-12">
            {results.map((p) => {
              const href = `/shop/producto/${p.id}`
              const image = p.variants?.[0]?.images?.[0] ?? ''

              return (
                <Link
                  key={p.id}
                  href={href}
                  onClick={onClose}
                  className="group flex items-center gap-4 px-3 py-3 -mx-3 hover:bg-gray-50 transition-colors duration-300"
                  suppressHydrationWarning
                >
                  <div className="relative w-16 h-16 overflow-hidden bg-stone-100 flex-shrink-0">
                    {image ? (
                      <Image src={image} alt={p.name} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm md:text-base text-gray-900 truncate">{p.name}</p>
                  </div>

                  <div className="flex-shrink-0 font-sans text-sm text-gray-500 tracking-wide">{p.price}€</div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

