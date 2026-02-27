'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const collections = [
  {
    id: 'isabelita',
    name: 'Isabelita',
    slug: 'isabelita',
    description: 'Elegancia clásica con un toque moderno',
    image: '/images/collection-isabelita.jpg',
    type: 'image' as const,
  },
  {
    id: 'vintage',
    name: 'Vintage',
    slug: 'vintage',
    description: 'Piezas atemporales del archivo flamenco',
    image: '/images/collection-vintage.jpg',
    type: 'image' as const,
  },
  {
    id: 'esencial',
    name: 'Esencial',
    slug: 'esencial',
    description: 'Lo fundamental reinventado',
    image: '/images/collection-esencial.jpg',
    type: 'image' as const,
  },
  {
    id: 'jaipur',
    name: 'Lost in Jaipur',
    slug: 'lost-in-jaipur',
    description: 'Un viaje entre dos culturas',
    image: '/images/collection-jaipur.jpg',
    type: 'image' as const,
  },
]

export default function CollectionsGrid() {
  return (
    <section className="bg-background py-16 md:py-24" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl mb-4 tracking-wide">
            Nuestras Colecciones
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Descubre nuestras colecciones exclusivas donde la tradición andaluza se encuentra con el diseño contemporáneo
          </p>
        </div>

        {/* Collections Grid - 2x2 Centered */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CollectionCard({ collection }: { collection: typeof collections[0] }) {
  return (
    <Link 
      href={`/colecciones/${collection.slug}`}
      className="group relative overflow-hidden bg-secondary/20 aspect-[4/5]"
      suppressHydrationWarning
    >
      {/* Image */}
      <Image
        src={collection.image}
        alt={collection.name}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <div className="relative">
          {/* Ver Colección Button */}
          <div className="flex items-center gap-2 mb-3 text-white/90 text-xs md:text-sm tracking-wider uppercase">
            <span className="group-hover:translate-x-1 transition-transform">Ver Colección</span>
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>

          {/* Collection Name */}
          <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-2 tracking-wide">
            {collection.name}
          </h3>

          {/* Description */}
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-md">
            {collection.description}
          </p>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 transition-colors pointer-events-none" />
    </Link>
  )
}
