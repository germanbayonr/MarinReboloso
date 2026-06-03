import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { fetchHomepagePortadaCollections } from '@/lib/collections'
import type { CollectionRecord } from '@/lib/collections'

function heroImage(collection: CollectionRecord, side: 'left' | 'right'): string | null {
  if (side === 'left') return collection.hero_image_left
  return collection.hero_image_right ?? collection.hero_image_left
}

function objectPositionClass(slug: string) {
  if (slug === 'corales') return 'object-[center_45%]'
  if (slug === 'jaipur') return 'object-[center_56%]'
  if (slug === 'filipa') return 'object-[center_40%]'
  if (slug === 'descara') return 'object-[center_56%]'
  return 'object-[center_25%]'
}

function HomepageHero({ collection }: { collection: CollectionRecord }) {
  const left = heroImage(collection, 'left')
  const right = heroImage(collection, 'right')
  const href = `/coleccion/${collection.slug}`
  const pos = objectPositionClass(collection.slug)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <Link href={href} className="group relative block h-[50vh] md:h-screen overflow-hidden">
        {left ? (
          <Image
            unoptimized
            src={left}
            alt={`${collection.label} — lifestyle`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover object-center transition-transform duration-700 ease-out scale-[1.4] group-hover:scale-[1.44] ${pos}`}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-end text-white p-10 md:p-12">
          <p className="font-sans text-[11px] sm:text-sm tracking-[0.35em] uppercase mb-5 md:mb-7 opacity-85">
            NUEVA COLECCIÓN
          </p>
          <ArrowRight className="w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:translate-x-2" />
        </div>
      </Link>

      <Link href={href} className="group relative block h-[50vh] md:h-screen overflow-hidden">
        {right ? (
          <Image
            unoptimized
            src={right}
            alt={`${collection.label} — producto`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${pos}`}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end text-white p-10 md:p-12 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide mb-6 md:mb-8">
            Colección {collection.label}
          </h1>
          <div className="group/btn relative inline-flex items-center justify-center h-12 px-8 sm:px-10 md:h-14 md:px-14 text-[11px] sm:text-xs tracking-[0.35em] uppercase border border-white/80 overflow-hidden transition-all duration-300">
            <span className="relative z-10 transition-colors duration-300 group-hover/btn:text-gray-900">
              VER COLECCIÓN
            </span>
            <div className="absolute inset-0 bg-white scale-x-0 origin-center transition-transform duration-300 group-hover/btn:scale-x-100" />
          </div>
        </div>
      </Link>
    </div>
  )
}

function HomepageBanner({ collection }: { collection: CollectionRecord }) {
  const image = collection.hero_image_left
  if (!image) return null
  const href = `/coleccion/${collection.slug}`
  const pos = objectPositionClass(collection.slug)

  return (
    <Link
      href={href}
      className="group relative block w-full overflow-hidden h-[60svh] min-h-[60svh] sm:h-[70svh] sm:min-h-[70svh] lg:h-[80vh] lg:min-h-[80vh]"
    >
      <Image
        unoptimized
        src={image}
        alt={`Colección ${collection.label}`}
        fill
        sizes="100vw"
        className={`object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.02] ${pos}`}
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 text-center">
        <p className="font-sans text-[10px] tracking-[0.35em] uppercase opacity-90">Colección</p>
        <h2 className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight">{collection.label}</h2>
        <span className="mt-8 inline-flex items-center justify-center h-11 border border-white px-8 text-[10px] tracking-[0.35em] uppercase transition-colors duration-300 group-hover:bg-white group-hover:text-black">
          Ver colección
        </span>
      </div>
    </Link>
  )
}

export default async function HomeCollectionsPortada() {
  const portada = await fetchHomepagePortadaCollections()
  const sorted = [...portada].sort((a, b) => a.homepage_order - b.homepage_order)
  const hero = sorted.find((c) => c.homepage_order === 1) ?? sorted[0]
  const banners = hero ? sorted.filter((c) => c.slug !== hero.slug) : sorted

  if (!hero && banners.length === 0) return null

  return (
    <section className="bg-background w-full overflow-hidden" aria-label="Colecciones en portada">
      {hero ? <HomepageHero collection={hero} /> : null}
      {banners.map((collection) => (
        <HomepageBanner key={collection.slug} collection={collection} />
      ))}
    </section>
  )
}
