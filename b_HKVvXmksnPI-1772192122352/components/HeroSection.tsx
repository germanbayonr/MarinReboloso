'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="bg-background overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-0 items-start min-h-[80vh]">

          {/* Left: Large editorial image */}
          <div className="relative h-[60vh] md:h-[85vh] overflow-hidden">
            <Image
              src="/images/hero-model.jpg"
              alt="Nueva colección Wayfar Brand"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>

          {/* Center: Text block */}
          <div className="flex flex-col justify-center px-6 md:px-10 py-8 md:py-0 md:min-w-[260px] md:max-w-[340px]">
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Nueva Colección
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-balance mb-6">
              Colección<br />Descará
            </h1>
            <p className="font-sans text-sm text-muted-foreground tracking-wide mb-8">
              &apos;26
            </p>
            <Link
              href="/shop/isabelita"
              className="group inline-flex items-center justify-center bg-foreground text-background px-8 py-4 text-xs tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors w-fit"
              suppressHydrationWarning
            >
              Ver colección
            </Link>

            {/* Watermark text */}
            <p className="font-serif text-[10px] md:text-xs tracking-[0.3em] uppercase text-border mt-16 hidden md:block select-none">
              New Collection
            </p>
          </div>

          {/* Right: Secondary image + collection link */}
          <div className="hidden md:flex flex-col gap-6 justify-start pt-8">
            <div className="relative h-[380px] overflow-hidden">
              <Image
                src="/images/collection-isabelita.jpg"
                alt="Colección Feria"
                fill
                priority
                sizes="35vw"
                className="object-cover"
              />
            </div>
            <Link
              href="/shop/isabelita"
              className="group flex items-center gap-3 hover:gap-4 transition-all"
              suppressHydrationWarning
            >
              <span className="font-serif text-xl md:text-2xl tracking-wide leading-tight text-balance">
                Colección<br />Feria
              </span>
              <ArrowRight className="h-5 w-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom watermark */}
      <div className="overflow-hidden pb-2 hidden md:block">
        <p className="font-serif text-[6vw] tracking-[0.15em] uppercase text-border/30 text-center select-none leading-none">
          New Collection
        </p>
      </div>
    </section>
  )
}
