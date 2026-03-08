import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'

export default function NuestraHistoriaPage() {
  return (
    <main className="min-h-screen" suppressHydrationWarning>
      <Navbar />
      
      {/* Hero with Collage Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background pt-16 md:pt-20">
        {/* Background Collage - Distributed across viewport */}
        <div className="absolute inset-0 grid grid-cols-4 gap-4 p-8 opacity-15">
          {/* Top Row */}
          <div className="relative h-64 col-span-1">
            <Image 
              src="/images/historia-collage-1.jpg" 
              alt="Wayfar jewelry"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          <div className="relative h-64 col-span-1">
            <Image 
              src="/images/historia-collage-2.jpg" 
              alt="Seville architecture"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          <div className="relative h-64 col-span-1">
            <Image 
              src="/images/historia-collage-3.jpg" 
              alt="Design studio"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          <div className="relative h-64 col-span-1">
            <Image 
              src="/images/historia-collage-4.jpg" 
              alt="Andalusian courtyard"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          
          {/* Middle Row */}
          <div className="relative h-64 col-span-2">
            <Image 
              src="/images/historia-collage-5.jpg" 
              alt="Embroidered shawl"
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className="relative h-64 col-span-1">
            <Image 
              src="/images/historia-collage-6.jpg" 
              alt="Fashion atelier"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          <div className="relative h-64 col-span-1">
            <Image 
              src="/images/historia-collage-7.jpg" 
              alt="María Marín"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          
          {/* Bottom Row */}
          <div className="relative h-64 col-span-1">
            <Image 
              src="/images/historia-collage-8.jpg" 
              alt="Seville Giralda"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          <div className="relative h-64 col-span-1">
            <Image 
              src="/images/historia-collage-1.jpg" 
              alt="Wayfar products"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          <div className="relative h-64 col-span-2">
            <Image 
              src="/images/historia-collage-2.jpg" 
              alt="Seville tiles"
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 py-24">
          {/* Heading */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-16 tracking-wide leading-tight">
            Nuestra Historia
          </h1>

          {/* Story Content */}
          <div className="space-y-6 font-sans text-base md:text-lg leading-relaxed text-foreground/90">
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

            <p className="text-balance font-serif text-xl md:text-2xl mt-12 text-center">
              Soy María Marín, y esta es mi forma de contar historias a través de cada pieza.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
