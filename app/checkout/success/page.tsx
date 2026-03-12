import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <div className="pt-28 lg:pt-36 pb-20 px-6 md:px-10 max-w-3xl mx-auto">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Pedido</p>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Gracias</h1>
        <p className="mt-6 text-sm text-muted-foreground tracking-wide">
          Hemos recibido tu pedido. En breve te enviaremos la confirmación por email.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex mt-10 border border-foreground px-8 py-3 text-[10px] tracking-[0.3em] uppercase hover:bg-foreground hover:text-background transition-colors"
          suppressHydrationWarning
        >
          Volver al catálogo
        </Link>
      </div>
    </main>
  )
}

