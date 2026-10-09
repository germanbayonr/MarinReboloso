import Image from 'next/image'

const FUNDING_IMAGE = '/images/cofinanciacion-junta-extremadura.png'

export default function PublicFundingNotice() {
  return (
    <section
      className="bg-background border-t border-border/40 py-6 md:py-8"
      aria-label="Información de cofinanciación pública"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <figure className="mx-auto w-full max-w-3xl md:max-w-4xl">
          <Image
            unoptimized
            src={FUNDING_IMAGE}
            alt="Proyecto cofinanciado por la Junta de Extremadura. María Marín Reboloso. Adquisición ordenador e impresora, elaboración y desarrollo web. Inversión aprobada 1.080,00 euros."
            width={1400}
            height={900}
            className="h-auto w-full object-contain"
            sizes="(max-width: 768px) 92vw, 896px"
          />
          <figcaption className="sr-only">
            Placa de cofinanciación Junta de Extremadura y Fondos Europeos
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
