import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'

export default function NuestraHistoriaPage() {
  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />
      
      {/* Editorial Content Section */}
      <section className="pt-32 pb-24 md:pt-48 md:pb-40 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
          
          {/* Text Column - Editorial Typography */}
          <div className="lg:col-span-7 flex flex-col justify-center order-2 lg:order-1 max-w-2xl animate-fade-in-up">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl mb-12 lg:mb-16 tracking-wide leading-[1.1] text-left">
              Nuestra Historia
            </h1>

            {/* Story Content - COPY UNTOUCHED AS PER RESTRICTION */}
            <div className="space-y-8 font-sans text-base md:text-lg leading-relaxed text-foreground/90">
              <p className="text-balance">
                Desde pequeña sentí que la moda formaba parte de mí. Siempre me fascinó cómo una pieza especial podía transformar algo sencillo en algo único.
              </p>

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

              <div className="pt-12 mt-8 border-t border-border/50">
                <p className="text-balance font-serif text-2xl md:text-3xl text-left tracking-tight italic opacity-90">
                  Soy María Marín, y esta es mi forma de contar historias a través de cada pieza.
                </p>
              </div>
            </div>
          </div>

          {/* Image Column - Editorial Portrait (Pamela/Hat) */}
          <div className="lg:col-span-5 order-1 lg:order-2 animate-fade-in-up animation-delay-300">
            <div className="relative aspect-[3/4] md:aspect-[4/5] lg:aspect-[3/4] w-full overflow-hidden shadow-2xl">
              <Image 
                src="/nuestra-historia.jpg" 
                alt="María Marín — Nuestra Historia"
                fill
                className="object-cover transition-transform duration-[1.5s] ease-out hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  )
}
