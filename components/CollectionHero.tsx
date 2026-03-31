import Image from 'next/image'

/**
 * Portadas alineadas con la Home:
 * - descara: mismo asset que el bloque izquierdo de HeroSection (lifestyle Descará)
 * - marebo, corales, filipa: mismas URLs que CollectionsGrid ("Nuestras Colecciones")
 */
const HERO_ASSETS: Record<
  string,
  {
    image: string
  }
> = {
  descara: {
    image:
      'https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Pasion%202.jpg',
  },
  marebo: {
    image: 'https://marebo.b-cdn.net/Colecciones/MAREBO/Pendiente%20Flor%20MAREBO%20Dore.png',
  },
  corales: {
    image:
      'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20_Aura%20Coralina_%20coral%20antiguo.PNG',
  },
  filipa: {
    image: 'https://marebo.b-cdn.net/Colecciones/Filipa/Collar%20Filipa.PNG',
  },
}

export default function CollectionHero({
  slug,
  title,
}: {
  slug: string
  title: string
}) {
  const key = String(slug ?? '').toLowerCase().trim()
  const asset = HERO_ASSETS[key]
  const objectPositionClass =
    key === 'corales'
      ? 'object-[center_45%]'
      : key === 'filipa'
        ? 'object-[center_40%]'
        : 'object-[center_25%]'

  return (
    <section aria-label={`Portada de colección ${title}`} className="w-full">
      <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden bg-stone-200">
        {asset?.image ? (
          <Image
            unoptimized={true}
            src={asset.image}
            alt={`Colección ${title}`}
            fill
            priority={true}
            sizes="100vw"
            className={`object-cover w-full h-full ${objectPositionClass}`}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl">
            <p className="font-sans text-[10px] tracking-[0.35em] uppercase opacity-90">Colección</p>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight">{title}</h1>
          </div>
        </div>
      </div>
    </section>
  )
}
