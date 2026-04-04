'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { isProductUuid } from '@/lib/shop-client-storage'

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [inStockById, setInStockById] = useState<Record<string, boolean>>({})
  const [stockLoaded, setStockLoaded] = useState(false)

  const formatPrice = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2))

  const idsKey = useMemo(
    () =>
      [...new Set(items.map((i) => i.id).filter(isProductUuid))]
        .sort()
        .join(','),
    [items],
  )

  useEffect(() => {
    if (!idsKey) {
      setInStockById({})
      setStockLoaded(true)
      return
    }

    let cancelled = false
    setStockLoaded(false)

    ;(async () => {
      const ids = idsKey.split(',').filter(Boolean)
      const { data, error } = await supabase
        .from('products')
        .select('id,in_stock')
        .eq('is_active', true)
        .in('id', ids)
      if (cancelled) return
      if (error) {
        setStockLoaded(true)
        return
      }
      const next: Record<string, boolean> = {}
      for (const row of data ?? []) {
        const r = row as { id: string; in_stock?: boolean }
        next[String(r.id)] = Boolean(r.in_stock)
      }
      setInStockById(next)
      setStockLoaded(true)
    })()

    return () => {
      cancelled = true
    }
  }, [idsKey])

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-24 md:px-10 lg:pt-32">
        <div className="max-w-3xl">
          <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Wishlist</p>
          <h1 className="font-serif text-4xl tracking-tight md:text-5xl">Tus Favoritos</h1>
        </div>

        {items.length === 0 ? (
          <div className="py-24">
            <p className="text-muted-foreground">Aún no has guardado ninguna pieza.</p>
            <Link
              href="/catalogo"
              className="mt-8 inline-flex border border-foreground px-8 py-3 text-[10px] uppercase tracking-[0.3em] transition-colors hover:bg-foreground hover:text-background"
              suppressHydrationWarning
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-14 lg:grid-cols-3">
            {items.map((item) => {
              const inStock = inStockById[item.id] === true
              const knownOutOfStock = stockLoaded && inStockById[item.id] === false
              const missingInDb =
                stockLoaded && isProductUuid(item.id) && !Object.prototype.hasOwnProperty.call(inStockById, item.id)

              return (
                <div key={item.id} className="space-y-5">
                  <div className="space-y-4">
                    <div className="relative">
                      <Link href={item.href} className="group block" suppressHydrationWarning>
                        <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                          <Image
                            unoptimized={true}
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        </div>
                      </Link>

                      <button
                        type="button"
                        aria-label="Quitar de wishlist"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeFromWishlist(item.id)
                        }}
                        className={cn(
                          'absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm',
                          'transition-transform duration-300 ease-out active:scale-90',
                        )}
                        suppressHydrationWarning
                      >
                        <Heart className="h-5 w-5 fill-gray-900 text-gray-900" strokeWidth={1.5} />
                      </button>
                    </div>

                    <Link href={item.href} className="block" suppressHydrationWarning>
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg tracking-tight">{item.name}</h3>
                        <p className="text-sm tracking-wide text-muted-foreground">
                          {typeof item.price === 'number' ? formatPrice(item.price) : String(item.price)}€
                        </p>
                      </div>
                    </Link>
                  </div>

                  <button
                    type="button"
                    disabled={!stockLoaded || !inStock || missingInDb}
                    onClick={async () => {
                      const { data, error } = await supabase
                        .from('products')
                        .select('id,name,price,image_url,stripe_price_id,in_stock')
                        .eq('is_active', true)
                        .eq('id', item.id)
                        .maybeSingle()
                      if (error || !data) {
                        toast.error('Este producto ya no está disponible.')
                        return
                      }
                      const row = data as {
                        id: string
                        name?: string
                        price?: unknown
                        image_url?: unknown
                        stripe_price_id?: string | null
                        in_stock?: boolean
                      }
                      if (!row.in_stock) {
                        toast.error('Sin stock: no se puede añadir a la cesta.')
                        return
                      }
                      const price =
                        typeof row.price === 'number' ? row.price : Number(row.price)
                      const imageUrl =
                        typeof row.image_url === 'string'
                          ? row.image_url
                          : Array.isArray(row.image_url) && typeof row.image_url[0] === 'string'
                            ? row.image_url[0]
                            : item.image

                      addToCart({
                        id: String(row.id),
                        name: String(row.name ?? item.name),
                        price: Number.isFinite(price) ? price : typeof item.price === 'number' ? item.price : Number(item.price),
                        image: String(imageUrl ?? item.image),
                        quantity: 1,
                        variant: 'Único',
                        stripe_price_id: row.stripe_price_id ? String(row.stripe_price_id) : null,
                      })
                      toast.success('Añadido a la cesta')
                    }}
                    className={cn(
                      'w-full border py-3 text-sm uppercase tracking-widest transition-colors',
                      knownOutOfStock || missingInDb || !stockLoaded
                        ? 'cursor-not-allowed border-neutral-300 text-neutral-400'
                        : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white',
                    )}
                    suppressHydrationWarning
                  >
                    {knownOutOfStock
                      ? 'Sin stock'
                      : missingInDb
                        ? 'No disponible'
                        : !stockLoaded
                          ? '…'
                          : 'Añadir al carrito'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
