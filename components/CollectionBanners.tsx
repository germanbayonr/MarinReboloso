import Image from 'next/image'
import Link from 'next/link'

const collections = [
  {
    title: 'Corales',
    href: '/coleccion/corales',
    image:
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Salmon.jpg',
  },
  {
    title: 'Marebo',
    href: '/coleccion/marebo',
    image:
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Flor%20MAREBO%20Dore.png',
  },
  {
    title: 'Filipa',
    href: '/coleccion/filipa',
    image:
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Filipa.PNG',
  },
]

export default function CollectionBanners() {
  return (
    <section aria-label="Colecciones" className="w-full">
      {collections.map((collection) => (
        <Link
          key={collection.href}
          href={collection.href}
          className="group block w-full h-[70vh] min-h-[70vh] relative overflow-hidden"
          suppressHydrationWarning
        >
          <Image
            src={collection.image}
            alt={`Colección ${collection.title}`}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority={false}
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
