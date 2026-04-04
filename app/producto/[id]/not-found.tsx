import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ProductoNotFound() {
  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-24 text-center md:px-12 md:pt-32 lg:px-24">
        <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Producto no disponible
        </p>
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">No encontramos esta pieza</h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          El enlace puede estar desactualizado o el producto ya no está a la venta.
        </p>
        <Link
          href="/catalogo"
          className="mt-10 inline-flex border border-foreground px-10 py-4 font-sans text-xs uppercase tracking-[0.25em] transition-all duration-300 hover:bg-foreground hover:text-background"
          suppressHydrationWarning
        >
          Ver catálogo
        </Link>
      </div>
      <Footer />
    </main>
  )
}
