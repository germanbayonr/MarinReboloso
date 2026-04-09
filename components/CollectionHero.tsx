import Image from 'next/image'

/**
 * Portadas por slug (cabecera /coleccion/[slug]).
 * Cubre al menos: descara, marebo, corales. Filipa se mantiene para la ruta homónima.
 * Corales: URL temporal acordada con la clienta (sustituible en CDN).
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
      'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Ivory.PNG',
  },
  jaipur: {
    image:
      'https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur(1).jpg',
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
      : key === 'jaipur'
        ? 'object-[center_56%]'
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
