'use client'

export interface PromoHeaderData {
  id: string
  announcement_text: string | null
  code: string
  discount_percentage: number
}

export default function PromoHeader({ promotion }: { promotion: PromoHeaderData }) {
  const text = promotion.announcement_text?.trim() || `DESCUENTO -${promotion.discount_percentage}% · ${promotion.code}`
  return (
    <div className="fixed left-0 top-0 z-[80] w-full bg-neutral-900 px-4 py-2 text-center text-[11px] tracking-[0.2em] text-white uppercase">
      {text}
    </div>
  )
}
