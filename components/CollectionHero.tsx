import Image from 'next/image'

/** Fallback CDN si la colección no tiene imágenes en Supabase */
const HERO_FALLBACK: Record<string, { left?: string; right?: string }> = {
  descara: {
    left: 'https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Pasion%202.jpg',
  },
  marebo: {
    left: 'https://marebo.b-cdn.net/Colecciones/MAREBO/Pendiente%20Flor%20MAREBO%20Dore.png',
  },
  corales: {
    left: 'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Ivory.PNG',
  },
  jaipur: {
    left: 'https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur(1).jpg',
  },
  filipa: {
    left: 'https://marebo.b-cdn.net/Colecciones/Filipa/Collar%20Filipa.PNG',
  },
}

const OBJECT_POSITION: Record<string, string> = {
  corales: 'object-[center_45%]',
  jaipur: 'object-[center_56%]',
  filipa: 'object-[center_40%]',
}

export default function CollectionHero({
  slug,
  title,
  heroImageLeft,
  heroImageRight,
}: {
  slug: string
  title: string
  heroImageLeft?: string | null
  heroImageRight?: string | null
}) {
  const key = String(slug ?? '').toLowerCase().trim()
  const fallback = HERO_FALLBACK[key]
  const left = heroImageLeft?.trim() || fallback?.left
  const right = heroImageRight?.trim() || fallback?.right
  const objectPositionClass = OBJECT_POSITION[key] ?? 'object-[center_25%]'
  const dualHero = Boolean(left && right)

  return (
    <section aria-label={`Portada de colección ${title}`} className="w-full">
      <div
        className={
          dualHero
            ? 'relative grid w-full grid-cols-1 md:grid-cols-2 h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden bg-stone-200'
            : 'relative w-full h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden bg-stone-200'
        }
      >
        {left ? (
          <div className={dualHero ? 'relative h-full min-h-[280px]' : 'absolute inset-0'}>
            <Image
              unoptimized
              src={left}
              alt={`Colección ${title}${dualHero ? ' — imagen izquierda' : ''}`}
              fill
              priority
              sizes={dualHero ? '50vw' : '100vw'}
              className={`object-cover w-full h-full ${objectPositionClass}`}
            />
          </div>
        ) : null}
        {right ? (
          <div className="relative h-full min-h-[280px]">
            <Image
              unoptimized
              src={right}
              alt={`Colección ${title} — imagen derecha`}
              fill
              priority
              sizes="50vw"
              className={`object-cover w-full h-full ${objectPositionClass}`}
            />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 text-center pointer-events-none">
          <div className="max-w-3xl">
            <p className="font-sans text-[10px] tracking-[0.35em] uppercase opacity-90">Colección</p>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight">{title}</h1>
          </div>
        </div>
      </div>
    </section>
  )
}
