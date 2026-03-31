'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { motion } from 'framer-motion'

const HERO_BG =
  'https://marebo.b-cdn.net/Colecciones/MAREBO/Aura%20Turquesa.PNG'

export default function NuestraHistoriaPage() {
  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />
      
      <section className="relative w-full min-h-[100svh] overflow-hidden bg-stone-200" suppressHydrationWarning>
        {/* Imagen a plena intensidad; el velo es suave para que se vea clara y el texto siga leyéndose */}
        <div className="absolute inset-0 z-0">
          <Image
            unoptimized={true}
            src={HERO_BG}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center scale-105"
          />
        </div>
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/25 via-black/15 to-black/35" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-24 min-h-[100svh] grid grid-cols-1 md:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
            className="md:col-span-5 md:col-start-1 self-start pt-28 md:pt-28 lg:pt-32"
          >
            <div className="relative max-w-xl bg-black/45 backdrop-blur-md border border-white/15 px-6 py-7 md:px-8 md:py-9">
              <div className="pointer-events-none absolute -top-6 -left-6 h-12 w-12 border-l border-t border-[#D4BFA0]/50" />
              <div className="pointer-events-none absolute -bottom-6 -right-6 h-12 w-12 border-r border-b border-[#D4BFA0]/50" />

              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D4BFA0]/60" />
                <span className="text-[10px] tracking-[0.35em] uppercase text-[#D4BFA0]/80">
                  MAREBO
                </span>
              </div>

              <h1 className="font-serif text-white text-4xl md:text-5xl lg:text-6xl tracking-wide leading-[1.05]">
                Nuestra Historia
              </h1>

              <p className="mt-6 font-sans text-white/90 text-base md:text-lg leading-relaxed text-balance first-letter:text-7xl md:first-letter:text-8xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:text-white">
                Desde pequeña sentí que la moda formaba parte de mí. Siempre me fascinó cómo una pieza especial podía transformar algo sencillo en algo único.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
            className="md:col-span-6 md:col-start-7 self-end pb-16 md:pb-20 lg:pb-24"
          >
            <div className="relative max-w-2xl ml-auto bg-black/45 backdrop-blur-md border border-white/15 px-6 py-7 md:px-8 md:py-9">
              <div className="pointer-events-none absolute -top-6 -right-6 h-12 w-12 border-r border-t border-[#D4BFA0]/50" />
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-12 w-12 border-l border-b border-[#D4BFA0]/50" />

              <div className="space-y-8 font-sans text-base md:text-lg leading-relaxed text-white/90">
                <p className="text-balance">
                  Aunque mi camino empezó en otro lugar. Estudié Ingeniería Agrónoma porque mis padres querían que tuviera una profesión segura. Recuerdo cuando me decían: <span className="italic">"María, ese mundo no es fácil."</span>
                </p>

                <p className="text-balance">
                  Y tenían razón. Pero hay sueños que no desaparecen, solo esperan su momento.
                </p>

                <p className="text-balance">
                  La primera persona que creyó en mí fue mi hermana. Un día me dijo: <span className="italic">"Yo te ayudo, vamos a hacerlo."</span>
                  <br />
                  Y así empezó todo.
                </p>

                <p className="text-balance">
                  Hoy cada pieza que diseño nace de esa ilusión inicial: crear algo especial, auténtico y diferente.
                </p>

                <div className="pt-10 mt-16 border-t border-white/20">
                  <p className="text-balance font-serif text-2xl md:text-3xl italic tracking-[0.12em] text-white/95">
                    Soy María Marín, y esta es mi forma de contar historias a través de cada pieza.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
