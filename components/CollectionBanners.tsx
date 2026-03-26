import Image from 'next/image'
import Link from 'next/link'

const collections = [
  {
    title: 'Corales',
    href: '/coleccion/corales',
    image:
      'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Sky%202.JPG',
  },
  {
    title: 'Marebo',
    href: '/coleccion/marebo',
    image:
      'https://marebo.b-cdn.net/Colecciones/Marebo/Flor%20MAREBO%20Dore.jpg',
  },
  {
    title: 'Filipa',
    href: '/coleccion/filipa',
    image:
      'https://marebo.b-cdn.net/Colecciones/Filipa/Pendientes-Linaje-Carmesi%202.png',
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
            src={collection.image}
            alt={`Colección ${collection.title}`}
            fill
            sizes="100vw"
            className={
              collection.title === 'Corales'
                ? 'object-cover object-[center_45%] w-full h-full'
                : collection.title === 'Filipa'
                  ? 'object-cover object-[center_40%] w-full h-full'
                  : 'object-cover object-[center_25%] w-full h-full'
            }
            priority={collection.title === 'Marebo' || collection.title === 'Filipa'}
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
