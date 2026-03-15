import Image from 'next/image'

const HERO_ASSETS: Record<
  string,
  {
    image: string
  }
> = {
  corales: {
    image: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Sky%202.JPG',
  },
  marebo: {
    image: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Flor%20MAREBO%20Dore.jpg',
  },
  filipa: {
    image: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes-Linaje-Carmesi%202.png',
  },
  descara: {
    image: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Alhambra.PNG',
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
      <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
        {asset?.image ? (
          <Image
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
