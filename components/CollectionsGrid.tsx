'use client'

import Image from 'next/image'
import Link from 'next/link'

const collections = [
  {
    id: 'descara',
    name: 'Descará',
    slug: 'descara',
    image: 'https://marebo.b-cdn.net/Colecciones/Descara/Pendientes%20Descara%20Alhambra.PNG',
  },
  {
    id: 'marebo',
    name: 'Marebo',
    slug: 'marebo',
    image: 'https://marebo.b-cdn.net/Colecciones/Marebo/Pendiente%20Flor%20MAREBO%20Dore.png',
  },
  {
    id: 'corales',
    name: 'Corales',
    slug: 'corales',
    image: 'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20_Aura%20Coralina_%20coral%20antiguo.PNG',
  },
  {
    id: 'filipa',
    name: 'Filipa',
    slug: 'filipa',
    image: 'https://marebo.b-cdn.net/Colecciones/Filipa/Collar%20Filipa.PNG',
  },
]

export default function CollectionsGrid() {
  return (
    <section className="bg-background py-20 md:py-32 overflow-hidden" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header - Fixed Stacking Context */}
        <div className="relative z-10 text-center mb-16 md:mb-24 max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 tracking-tight leading-tight">
            Nuestras Colecciones
          </h2>
          <div className="w-12 h-[1px] bg-foreground/20 mx-auto mb-6" />
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed px-4">
            Piezas de alta joyería que celebran la herencia andaluza a través de una mirada contemporánea y sofisticada.
          </p>
        </div>

        {/* Collections Grid - Editorial 1/2/3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {collections.map((collection, index) => (
            <div 
              key={collection.id}
              className={index >= 3 ? "lg:col-span-1" : ""}
            >
              <CollectionCard collection={collection} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CollectionCard({ collection }: { collection: typeof collections[0] }) {
  return (
    <Link 
      href={`/coleccion/${collection.slug}`}
      className="group block relative overflow-hidden bg-stone-100"
      suppressHydrationWarning
    >
      {/* Editorial Aspect Ratio 3:4 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image unoptimized
          src={collection.image}
          alt={`Colección ${collection.name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          priority={false}
        />
        
        {/* Subtle overlay for legibility */}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
      </div>

      {/* Collection Info - Minimalist Editorial Style */}
      <div className="mt-6 text-center">
        <h3 className="font-serif text-2xl md:text-3xl tracking-wide text-foreground group-hover:opacity-60 transition-opacity duration-300">
          {collection.name}
        </h3>
        <span className="inline-block mt-2 text-[10px] tracking-[0.3em] uppercase text-muted-foreground border-b border-transparent group-hover:border-muted-foreground/30 transition-all duration-300">
          Explorar
        </span>
      </div>
    </Link>
  )
}
