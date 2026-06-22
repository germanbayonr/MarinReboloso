'use client'

import { Check, Copy, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SESSION_KEY = 'marebo-promo-banner-dismissed'

type BannerPromotion = {
  id: string
  announcement_text: string | null
  code: string
  discount_percentage: number
}

export default function PromoBannerPopup() {
  const [promotion, setPromotion] = useState<BannerPromotion | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') return

    let cancelled = false
    let timer: number | null = null

    const openWithDelay = () => {
      timer = window.setTimeout(() => {
        if (!cancelled) setIsOpen(true)
      }, 2000)
    }

    const loadPromotion = async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('id,announcement_text,code,discount_percentage')
        .eq('is_active', true)
        .eq('type', 'banner_popup')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cancelled || error || !data) return
      setPromotion({
        id: String(data.id),
        announcement_text: data.announcement_text ? String(data.announcement_text) : null,
        code: String(data.code),
        discount_percentage: Number(data.discount_percentage) || 0,
      })
      openWithDelay()
    }

    void loadPromotion()
    return () => {
      cancelled = true
      if (timer != null) window.clearTimeout(timer)
    }
  }, [])

  const text = useMemo(() => {
    if (!promotion) return ''
    return (
      promotion.announcement_text?.trim() || `DESCUENTOS ESPECIALES -${promotion.discount_percentage}% EN TODA LA WEB`
    )
  }, [promotion])

  if (!promotion || !isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 px-4">
      <div className="relative w-full max-w-2xl overflow-hidden border border-[#d4c5b9] bg-gradient-to-br from-[#fffaf6] via-white to-[#f7efe7] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,197,185,0.35),transparent_45%)]" />
        <button
          type="button"
          aria-label="Cerrar promoción"
          className="absolute right-4 top-4 rounded-sm p-1 text-neutral-500 hover:text-neutral-900"
          onClick={() => {
            setIsOpen(false)
            window.sessionStorage.setItem(SESSION_KEY, '1')
          }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative">
          <p className="text-center text-[11px] uppercase tracking-[0.35em] text-neutral-500">Oferta exclusiva</p>
          <p className="mt-4 pr-6 text-center font-serif text-3xl leading-tight text-neutral-900 md:text-4xl">{text}</p>
          <p className="mt-3 text-center text-xs uppercase tracking-[0.3em] text-neutral-600">
            Activa ahora · -{promotion.discount_percentage}% en web
          </p>
        </div>

        <div className="relative mt-7 flex items-center justify-between border border-dashed border-[#c7b09d] bg-white/80 px-5 py-4">
          <span className="font-mono text-lg tracking-[0.35em] text-neutral-900">{promotion.code}</span>
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-neutral-300 bg-white px-3 py-2 text-xs uppercase tracking-widest text-neutral-700 hover:border-neutral-500 hover:text-neutral-900"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(promotion.code)
                setIsCopied(true)
                window.setTimeout(() => setIsCopied(false), 1200)
              } catch {}
            }}
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
