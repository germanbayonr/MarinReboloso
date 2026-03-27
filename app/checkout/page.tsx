'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/validation/checkout'
import { COUNTRIES } from '@/lib/data/locations'
import { useCart } from '@/lib/cart-context'
import { ArrowLeft } from 'lucide-react'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-2 text-[11px] text-red-600/80 tracking-wide">{message}</p>
}

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const defaultValues: CheckoutFormValues = useMemo(
    () => ({
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      address1: '',
      city: '',
      postalCode: '',
      country: 'España',
      terms: false,
    }),
    [],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const onSubmit = handleSubmit(
    async (values, event) => {
      event?.preventDefault()
      if (isLoading) return

      setSubmitError(null)
      setIsLoading(true)
      try {
        if (cartItems.length === 0) {
          throw new Error('Tu cesta está vacía.')
        }

        const missingStripeIds = cartItems.some((i) => !i.stripe_price_id)
        if (missingStripeIds) {
          throw new Error('Estamos preparando el pago. Espera un momento y vuelve a intentarlo.')
        }

        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            cartItems: cartItems.map((item) => ({
              id: item.id,
              quantity: item.quantity,
              stripe_price_id: item.stripe_price_id,
            })),
            customer: values,
          }),
        })

        const data = (await res.json().catch(() => null)) as any

        if (!res.ok) {
          const message =
            data?.error?.message ||
            data?.error ||
            `No se pudo iniciar el pago (HTTP ${res.status}).`
          throw new Error(String(message))
        }

        const url = data?.url
        if (!url || typeof url !== 'string') {
          throw new Error('Respuesta inválida del servidor: falta URL de Stripe.')
        }

        window.location.href = url
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error inesperado al iniciar el pago'
        setSubmitError(message)
        alert(message)
      } finally {
        setIsLoading(false)
      }
    },
    (_invalid, event) => {
      event?.preventDefault()
      const message = 'Revisa los campos marcados en rojo e inténtalo de nuevo.'
      setSubmitError(message)
      alert(message)
    },
  )

  const formattedSubtotal = `${cartTotal.toFixed(2)}€`
  const shipping = 5
  const total = cartTotal + shipping
  const isPreparingPayment = useMemo(() => cartItems.some((i) => !i.stripe_price_id), [cartItems])

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <div className="pt-28 lg:pt-36 pb-16 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Checkout</p>
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Finalizar Pedido</h1>
          </div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            suppressHydrationWarning
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            Volver a la cesta
          </Link>
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
        ) : null}

        {submitError ? (
          <div className="mt-8 border border-red-200/60 bg-red-50/60 px-4 py-3 text-sm text-red-900 tracking-wide">
            {submitError}
          </div>
        ) : null}

        {cartItems.length > 0 ? (
        <form onSubmit={onSubmit} className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12" suppressHydrationWarning>
          <div className="lg:col-span-7 xl:col-span-8 space-y-14">
              <section>
                <h2 className="font-serif text-2xl tracking-tight">Información de Contacto</h2>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500">Email</label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className="mt-3 w-full bg-transparent border-b border-gray-300 pb-3 text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 focus:border-gray-900"
                      {...register('email')}
                    />
                    <FieldError message={errors.email?.message} />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500">Teléfono</label>
                    <input
                      type="tel"
                      placeholder="+34 600 000 000"
                      className="mt-3 w-full bg-transparent border-b border-gray-300 pb-3 text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 focus:border-gray-900"
                      {...register('phone')}
                    />
                    <FieldError message={errors.phone?.message} />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-serif text-2xl tracking-tight">Dirección de Envío</h2>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500">Nombre</label>
                    <input
                      type="text"
                      className="mt-3 w-full bg-transparent border-b border-gray-300 pb-3 text-base text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-900"
                      {...register('firstName')}
                    />
                    <FieldError message={errors.firstName?.message} />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500">Apellidos</label>
                    <input
                      type="text"
                      className="mt-3 w-full bg-transparent border-b border-gray-300 pb-3 text-base text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-900"
                      {...register('lastName')}
                    />
                    <FieldError message={errors.lastName?.message} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500">Dirección</label>
                    <input
                      type="text"
                      className="mt-3 w-full bg-transparent border-b border-gray-300 pb-3 text-base text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-900"
                      {...register('address1')}
                    />
                    <FieldError message={errors.address1?.message} />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500">Población</label>
                    <input
                      type="text"
                      className="mt-3 w-full bg-transparent border-b border-gray-300 pb-3 text-base text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-900"
                      {...register('city')}
                    />
                    <FieldError message={errors.city?.message} />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500">Código Postal</label>
                    <input
                      type="text"
                      placeholder="41001"
                      className="mt-3 w-full bg-transparent border-b border-gray-300 pb-3 text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 focus:border-gray-900"
                      {...register('postalCode')}
                    />
                    <FieldError message={errors.postalCode?.message} />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500">País</label>
                    <select
                      className="mt-3 w-full bg-transparent border-b border-gray-300 pb-3 text-base text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-900"
                      {...register('country')}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.country?.message} />
                  </div>
                </div>
              </section>

              <section>
                <label className="flex items-start gap-3 text-sm text-gray-700 tracking-wide">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                    {...register('terms')}
                  />
                  <span>
                    He leído y acepto los{' '}
                    <Link href="/legal" className="text-gray-900 underline underline-offset-4" suppressHydrationWarning>
                      términos
                    </Link>
                    .
                  </span>
                </label>
                <FieldError message={errors.terms?.message} />
              </section>
          </div>

          <aside className="lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-8 border border-gray-200 p-8">
              <h2 className="font-serif text-2xl tracking-tight">Resumen</h2>

              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const image = item.image
                    const productHref = `/producto/${encodeURIComponent(item.id)}`
                    return (
                      <div key={`${item.id}__${item.variant ?? ''}`} className="flex items-center gap-4">
                        <Link
                          href={productHref}
                          className="relative w-14 h-16 overflow-hidden bg-stone-100 flex-shrink-0 block"
                          suppressHydrationWarning
                        >
                          <Image unoptimized={true} src={image} alt={item.name} fill sizes="56px" className="object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link href={productHref} className="block min-w-0" suppressHydrationWarning>
                            <p className="text-sm font-sans text-gray-900 truncate underline-offset-4 hover:underline">
                              {item.name}
                            </p>
                          </Link>
                          {item.variant ? (
                            <p className="mt-1 text-[11px] text-gray-500 tracking-wide truncate">{item.variant}</p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-gray-500 tracking-wide">x{item.quantity}</p>
                        </div>
                        <div className="text-sm text-gray-700 tracking-wide">{(item.price * item.quantity).toFixed(2)}€</div>
                      </div>
                    )
                  })}
                </div>

                <div className="h-px bg-gray-200" />

                <div className="space-y-3 text-sm tracking-wide">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formattedSubtotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Envío</span>
                    <span className="text-gray-900">5€ (España)</span>
                  </div>
                  <div className="h-px bg-gray-200 my-4" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{total.toFixed(2)}€</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isFormSubmitting}
                  className="mt-8 w-full bg-gray-900 text-white py-4 text-base uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-60"
                  suppressHydrationWarning
                >
                  {isLoading ? 'Conectando pasarela segura…' : 'Realizar el pedido'}
                </button>
                {isPreparingPayment ? (
                  <p className="mt-3 text-[11px] text-muted-foreground tracking-wide">
                    Preparando el pago seguro…
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </form>
        ) : null}
      </div>

      <Footer />
    </main>
  )
}
