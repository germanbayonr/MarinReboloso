import Link from 'next/link'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export default function PedidoNotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-16">
        <h1 className="font-serif text-2xl text-foreground mb-2">Pedido no encontrado</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Comprueba el enlace o ponte en contacto con nosotras si necesitas ayuda.
        </p>
        <Link href="/catalogo" className="text-sm underline text-foreground hover:text-accent">
          Ir al catálogo
        </Link>
      </main>
      <Footer />
    </>
  )
}
