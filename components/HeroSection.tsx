'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="bg-background w-full overflow-hidden" suppressHydrationWarning>
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* --- BLOQUE IZQUIERDO: LIFESTYLE --- */}
        <Link 
          href="/shop/corales"
          className="group relative block h-[50vh] md:h-screen overflow-hidden"
          suppressHydrationWarning
        >
          <Image
            src="https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Sky.JPG"
            alt="Lifestyle Colección Corales"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute inset-0 flex flex-col items-start justify-end text-white p-10 md:p-12">
            <p className="text-xs tracking-[0.4em] uppercase mb-4 opacity-80">
              NUEVA COLECCIÓN
            </p>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
          </div>
        </Link>

        {/* --- BLOQUE DERECHO: PRODUCTO --- */}
        <Link 
          href="/shop/corales"
          className="group relative block h-[50vh] md:h-screen overflow-hidden"
          suppressHydrationWarning
        >
          <Image
            src="https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Sky.PNG"
            alt="Producto Colección Corales"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute inset-0 flex flex-col items-center justify-end text-white p-10 md:p-12 text-center">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight tracking-wide mb-8">
              Colección Corales
            </h1>
            <div
              className="group/btn relative inline-flex items-center justify-center px-8 py-3 text-sm tracking-widest uppercase border border-white/80 overflow-hidden transition-all duration-300"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover/btn:text-gray-900">
                VER COLECCIÓN
              </span>
              <div className="absolute inset-0 bg-white scale-x-0 origin-center transition-transform duration-300 group-hover/btn:scale-x-100" />
            </div>
          </div>
        </Link>

      </div>
    </section>
  )
}
