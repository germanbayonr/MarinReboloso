'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useCart } from '@/lib/cart-context'
import { Minus, Plus, X } from 'lucide-react'

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart()

  const formattedSubtotal = `${cartTotal.toFixed(2)}€`

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="pt-28 lg:pt-36 pb-32 md:pb-16 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Cesta</p>
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Tu Cesta</h1>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground tracking-wide">
            {cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="py-24">
            <p className="text-muted-foreground">Tu cesta está vacía.</p>
            <Link
              href="/catalogo"
              className="inline-flex mt-8 border border-foreground px-8 py-3 text-[10px] tracking-[0.3em] uppercase hover:bg-foreground hover:text-background transition-colors"
              suppressHydrationWarning
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-12">
            <div className="hidden md:grid md:grid-cols-12 text-[10px] tracking-[0.3em] uppercase text-muted-foreground pb-3 border-b border-gray-200">
              <div className="md:col-span-6">Producto</div>
              <div className="md:col-span-2 text-right">Precio</div>
              <div className="md:col-span-2 text-center">Cantidad</div>
              <div className="md:col-span-2 text-right">Subtotal</div>
            </div>

            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => {
                const subtotal = item.price * item.quantity
                const productHref = `/producto/${encodeURIComponent(item.id)}`
                return (
                  <div key={`${item.id}__${item.variant ?? ''}`} className="py-6">
                    <div className="flex gap-4 md:hidden">
                      <Link
                        href={productHref}
                        className="relative w-24 h-32 overflow-hidden bg-stone-100 flex-shrink-0 block"
                        suppressHydrationWarning
                      >
                        <Image unoptimized={true} src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={productHref} className="block min-w-0" suppressHydrationWarning>
                              <p className="font-serif text-base truncate underline-offset-4 hover:underline">
                                {item.name}
                              </p>
                            </Link>
                            {item.variant && (
                              <p className="mt-1 text-xs text-muted-foreground tracking-wide truncate">{item.variant}</p>
                            )}
                            <p className="mt-2 text-sm text-muted-foreground tracking-wide">{item.price.toFixed(2)}€</p>
                          </div>
                          <button
                            type="button"
                            aria-label="Eliminar"
                            onClick={() => removeFromCart(item.id, item.variant)}
                            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            suppressHydrationWarning
                          >
                            <X className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <div className="inline-flex items-center border border-gray-200">
                            <button
                              type="button"
                              aria-label="Disminuir cantidad"
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                              className="w-10 h-10 flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
                              suppressHydrationWarning
                            >
                              <Minus className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <div className="w-12 h-10 flex items-center justify-center text-sm tracking-widest">
                              {item.quantity}
                            </div>
                            <button
                              type="button"
                              aria-label="Aumentar cantidad"
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                              className="w-10 h-10 flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
                              suppressHydrationWarning
                            >
                              <Plus className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </div>

                          <div className="text-sm tracking-wide">{subtotal.toFixed(2)}€</div>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:grid md:grid-cols-12 md:items-center gap-6">
                      <div className="md:col-span-6 flex items-center gap-5 min-w-0">
                        <Link
                          href={productHref}
                          className="relative w-24 h-32 overflow-hidden bg-stone-100 flex-shrink-0 block"
                          suppressHydrationWarning
                        >
                          <Image unoptimized={true} src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                        </Link>
                        <div className="min-w-0">
                          <Link href={productHref} className="block min-w-0" suppressHydrationWarning>
                            <p className="font-serif text-lg truncate underline-offset-4 hover:underline">
                              {item.name}
                            </p>
                          </Link>
                          {item.variant && (
                            <p className="mt-1 text-xs text-muted-foreground tracking-wide truncate">{item.variant}</p>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2 text-right text-sm text-muted-foreground tracking-wide">
                        {item.price.toFixed(2)}€
                      </div>

                      <div className="md:col-span-2 flex items-center justify-center">
                        <div className="inline-flex items-center border border-gray-200">
                          <button
                            type="button"
                            aria-label="Disminuir cantidad"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                            className="w-10 h-10 flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
                            suppressHydrationWarning
                          >
                            <Minus className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <div className="w-12 h-10 flex items-center justify-center text-sm tracking-widest">
                            {item.quantity}
                          </div>
                          <button
                            type="button"
                            aria-label="Aumentar cantidad"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                            className="w-10 h-10 flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
                            suppressHydrationWarning
                          >
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-2 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <div className="text-sm tracking-wide">{subtotal.toFixed(2)}€</div>
                          <button
                            type="button"
                            aria-label="Eliminar"
                            onClick={() => removeFromCart(item.id, item.variant)}
                            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            suppressHydrationWarning
                          >
                            <X className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="md:hidden sticky bottom-0 z-50 bg-white border-t border-gray-100 p-4">
          <div className="flex items-center justify-between text-sm tracking-wide">
            <span className="text-muted-foreground">Total</span>
            <span className="text-gray-900">{formattedSubtotal}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-3 w-full bg-gray-900 text-white uppercase tracking-widest py-4 hover:bg-black transition-colors inline-flex items-center justify-center"
            suppressHydrationWarning
          >
            Finalizar compra
          </Link>
          <p className="mt-2 text-[11px] text-muted-foreground tracking-wide">Envío a España: 5€</p>
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="hidden md:block pb-16 px-6 md:px-10 max-w-7xl mx-auto">
          <div className="border-t border-gray-200 pt-10 grid grid-cols-12 gap-10 items-start">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-sm text-muted-foreground tracking-wide">Envío: calculado en el siguiente paso</p>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <div className="border border-gray-200 p-8">
                <h2 className="font-serif text-2xl tracking-tight">Resumen</h2>
                <div className="mt-6 space-y-3 text-sm tracking-wide">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-gray-900">{formattedSubtotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="text-gray-900">5€ (España)</span>
                  </div>
                  <div className="h-px bg-gray-200 my-4" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{(cartTotal + 5).toFixed(2)}€</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="mt-8 w-full bg-gray-900 text-white uppercase tracking-widest py-4 hover:bg-black transition-colors inline-flex items-center justify-center"
                  suppressHydrationWarning
                >
                  Finalizar compra
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
