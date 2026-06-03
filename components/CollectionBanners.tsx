import Image from 'next/image'
import Link from 'next/link'
import { BANNER_CORALES, BANNER_FILIPA, BANNER_MAREBO } from '@/lib/home-page-images'

const collections = [
  {
    title: 'Corales',
    slug: 'corales',
    href: '/coleccion/corales',
    image: BANNER_CORALES,
  },
  {
    title: 'Marebo',
    slug: 'marebo',
    href: '/coleccion/marebo',
    image: BANNER_MAREBO,
  },
  {
    title: 'Filipa',
    slug: 'filipa',
    href: '/coleccion/filipa',
    image: BANNER_FILIPA,
  },
]

export default function CollectionBanners() {
  return (
    <section aria-label="Colecciones" className="w-full">
      {collections.map((collection) => (
        <Link
          key={collection.href}
          href={collection.href}
          className="group block w-full relative overflow-hidden h-[60svh] min-h-[60svh] sm:h-[70svh] sm:min-h-[70svh] lg:h-[80vh] lg:min-h-[80vh]"
          suppressHydrationWarning
        >
          <Image
            unoptimized
            src={collection.image}
            alt={`Colección ${collection.title}`}
            fill
            priority
            sizes="100vw"
            className={
              collection.slug === 'corales'
                ? 'object-cover object-[center_45%] w-full h-full'
                : collection.slug === 'filipa'
                  ? 'object-cover object-[center_46%] w-full h-full'
                  : 'object-cover object-[center_25%] w-full h-full'
            }
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-6 text-center">
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
              {collection.title}
            </h2>
            <span className="mt-8 md:mt-10 inline-flex items-center justify-center h-11 md:h-12 border border-white px-7 sm:px-9 md:px-12 text-[10px] sm:text-xs tracking-[0.35em] uppercase transition-colors duration-300 group-hover:bg-white group-hover:text-black">
              Explorar
            </span>
          </div>
        </Link>
      ))}
    </section>
  )
}
