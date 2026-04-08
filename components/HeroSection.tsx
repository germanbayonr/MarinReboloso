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
          href="/coleccion/jaipur"
          className="group relative block h-[50vh] md:h-screen overflow-hidden"
        >
          <div
            className={[
              'absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
              isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[1.03]',
            ].join(' ')}
          >
            <Image
              unoptimized={true}
              src="https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur(1).jpg"
              alt="Lifestyle Colección Jaipur"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-out scale-[1.4] group-hover:scale-[1.44]"
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
          href="/coleccion/jaipur"
          className="group relative block h-[50vh] md:h-screen overflow-hidden"
        >
          <div
            className={[
              'absolute inset-0 transition-[opacity,transform] duration-[1200ms] delay-[120ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
              isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[1.03]',
            ].join(' ')}
          >
            <Image
              unoptimized={true}
              src="https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur.PNG"
              alt="Producto Colección Jaipur"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute inset-0 flex flex-col items-center justify-end text-white p-10 md:p-12 text-center">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide mb-6 md:mb-8">
              Colección Jaipur
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

      {/* --- NUEVA SECCIÓN DE DESCARÁ (debajo de la hero principal) --- */}
      <Link
        href="/coleccion/descara"
        className="group relative block w-full overflow-hidden h-[60svh] min-h-[60svh] sm:h-[70svh] sm:min-h-[70svh] lg:h-[80vh] lg:min-h-[80vh]"
      >
        <Image
          unoptimized={true}
          src="https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Pasion%202.jpg"
          alt="Colección Descará"
          fill
          sizes="100vw"
          className="object-cover object-[center_56%] transition-transform duration-700 ease-out scale-[2.12] group-hover:scale-[2.16]"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 text-center">
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase opacity-90">Colección</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight">Descará</h2>
          <span className="mt-8 inline-flex items-center justify-center h-11 border border-white px-8 text-[10px] tracking-[0.35em] uppercase transition-colors duration-300 group-hover:bg-white group-hover:text-black">
            Ver colección
          </span>
        </div>
      </Link>
    </section>
  )
}
