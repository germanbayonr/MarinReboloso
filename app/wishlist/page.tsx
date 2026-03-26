'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const formatPrice = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2))

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="pt-24 lg:pt-32 pb-16 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Wishlist
          </p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Tus Favoritos</h1>
        </div>

        {items.length === 0 ? (
          <div className="py-24">
            <p className="text-muted-foreground">Aún no has guardado ninguna pieza.</p>
            <Link
              href="/catalogo"
              className="inline-flex mt-8 border border-foreground px-8 py-3 text-[10px] tracking-[0.3em] uppercase hover:bg-foreground hover:text-background transition-colors"
              suppressHydrationWarning
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
            {items.map((item) => (
              <div key={item.id} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <Link href={item.href} className="group block" suppressHydrationWarning>
                      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                        <Image unoptimized
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
                        'absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center',
                        'transition-transform duration-300 ease-out active:scale-90',
                      )}
                      suppressHydrationWarning
                    >
                      <Heart className="w-5 h-5 fill-gray-900 text-gray-900" strokeWidth={1.5} />
                    </button>
                  </div>

                  <Link href={item.href} className="block" suppressHydrationWarning>
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg tracking-tight">{item.name}</h3>
                      <p className="text-sm text-muted-foreground tracking-wide">
                        {typeof item.price === 'number' ? formatPrice(item.price) : String(item.price)}€
                      </p>
                    </div>
                  </Link>
                </div>

                <button
                  onClick={async () => {
                    const { data, error } = await supabase
                      .from('products')
                      .select('id,name,price,image_url,stripe_price_id')
                      .eq('id', item.id)
                      .maybeSingle()
                    if (error || !data?.id) return

                    const price = typeof (data as any).price === 'number' ? (data as any).price : Number((data as any).price)

                    addToCart({
                      id: String((data as any).id),
                      name: String((data as any).name ?? item.name),
                      price: Number.isFinite(price) ? price : (typeof item.price === 'number' ? item.price : Number(item.price)),
                      image: String((data as any).image_url ?? item.image),
                      quantity: 1,
                      variant: 'Único',
                      stripe_price_id: (data as any).stripe_price_id ? String((data as any).stripe_price_id) : null,
                    })
                  }}
                  className="w-full border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors py-3 text-sm tracking-widest uppercase"
                  suppressHydrationWarning
                >
                  Añadir al carrito
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
