'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function HeroSection() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  return (
    <section className="bg-background w-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* --- BLOQUE IZQUIERDO: LIFESTYLE --- */}
        <Link 
          href="/coleccion/descara"
          className="group relative block h-[50vh] md:h-screen overflow-hidden"
        >
          <div
            className={[
              'absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
              isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[1.03]',
            ].join(' ')}
          >
            <Image unoptimized
              src="https://marebo.b-cdn.net/Colecciones/Descara/WhatsApp%20Image%202026-03-11%20at%2006.57.39.jpeg"
              alt="Lifestyle Colección Descará"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-out scale-[1.24] group-hover:scale-[1.28]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute inset-0 flex flex-col items-start justify-end text-white p-10 md:p-12">
            <p className="font-sans text-[11px] sm:text-sm tracking-[0.35em] uppercase mb-5 md:mb-7 opacity-85">
              NUEVA COLECCIÓN
            </p>
            <ArrowRight className="w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:translate-x-2" />
          </div>
        </Link>

        {/* --- BLOQUE DERECHO: PRODUCTO --- */}
        <Link 
          href="/coleccion/descara"
          className="group relative block h-[50vh] md:h-screen overflow-hidden"
        >
          <div
            className={[
              'absolute inset-0 transition-[opacity,transform] duration-[1200ms] delay-[120ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
              isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[1.03]',
            ].join(' ')}
          >
            <Image unoptimized
              src="https://marebo.b-cdn.net/Colecciones/Descara/Pendientes%20Descara%20Pasion.PNG"
              alt="Producto Colección Descará"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute inset-0 flex flex-col items-center justify-end text-white p-10 md:p-12 text-center">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide mb-6 md:mb-8">
              Colección Descará
            </h1>
            <div
              className="group/btn relative inline-flex items-center justify-center h-12 px-8 sm:px-10 md:h-14 md:px-14 text-[11px] sm:text-xs tracking-[0.35em] uppercase border border-white/80 overflow-hidden transition-all duration-300"
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
