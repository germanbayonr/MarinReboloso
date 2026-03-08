'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="bg-background w-full overflow-hidden" suppressHydrationWarning>      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">

        {/* LEFT PANEL — Colección Descará */}
        <Link href="/shop/descara" className="relative overflow-hidden group block min-h-[55vh] md:min-h-[90vh]" suppressHydrationWarning>
          <Image
            src="/images/descarà-hero.jpg"
            alt="Colección Descará — Wayfar Brand"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
          />

          {/* Subtle gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/20 pointer-events-none" />

          {/* Top-right text overlay */}
          <div className="absolute top-8 right-8 md:top-12 md:right-10 text-right animate-fade-in-up">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-white/70 mb-2">
              Nueva Colección
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1] text-white tracking-tight text-balance">
              Colección<br />Descará
            </h1>
          </div>

          {/* Bottom CTA - span instead of Link since parent is already clickable */}
          <div className="absolute bottom-8 right-8 md:bottom-10 md:right-10 animate-fade-in-up animation-delay-300">
            <span
              className="group/btn inline-flex items-center gap-2 border border-white/60 text-white px-6 py-3 text-[10px] tracking-[0.25em] uppercase group-hover:bg-white group-hover:text-foreground transition-all duration-300"
            >
              Ver colección
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </span>
          </div>
        </Link>

        {/* RIGHT PANEL — Colección Feria */}
        <Link href="/shop/feria" className="relative overflow-hidden group block min-h-[55vh] md:min-h-[90vh]" suppressHydrationWarning>
          <Image
            src="/images/feria-hero.jpg"
            alt="Colección Feria — Wayfar Brand"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
          />

          {/* Subtle gradient bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Bottom-left text overlay */}
          <div className="absolute bottom-8 left-8 md:bottom-12 md:left-10 animate-fade-in-up animation-delay-150">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-white/70 mb-2">
              Colección
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1] text-white tracking-tight">
              Feria
            </h2>
            <span
              className="group/btn mt-5 inline-flex items-center gap-2 text-white/80 group-hover:text-white text-[10px] tracking-[0.25em] uppercase transition-colors duration-200"
            >
              Ver colección
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </span>
          </div>
        </Link>

      </div>

      {/* Bottom marquee watermark */}
      <div className="overflow-hidden py-3 border-t border-border/30">
        <p className="font-serif text-[5vw] md:text-[3.5vw] tracking-[0.2em] uppercase text-border/25 text-center select-none leading-none whitespace-nowrap">
          New Collection &nbsp;&nbsp;·&nbsp;&nbsp; Wayfar Brand &nbsp;&nbsp;·&nbsp;&nbsp; Sevilla
        </p>
      </div>
    </section>
  )
}
