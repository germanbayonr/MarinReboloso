import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type OrderRefRow = {
  id?: string | null
  order_number?: string | null
  created_at?: string | null
}

async function findLatestOrderBySessionId(sessionId: string) {
  const supabase = createSupabaseServerClient()
  const fields = ['stripe_session_id', 'stripe_checkout_session_id', 'checkout_session_id', 'session_id'] as const

  for (const field of fields) {
    const res = await supabase
      .from('orders')
      .select('id,order_number,created_at')
      .eq(field, sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (res.data) return res.data as OrderRefRow
    if (res.error && !String(res.error.message ?? '').includes('column') && !String(res.error.message ?? '').includes('does not exist')) {
      break
    }
  }

  return null
}

function shortId(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '')
  if (cleaned.length <= 10) return cleaned.toUpperCase()
  return cleaned.slice(-10).toUpperCase()
}

export default async function SuccessContent({ sessionId }: { sessionId: string | null }) {
  const order = sessionId ? await findLatestOrderBySessionId(sessionId) : null
  const reference = order?.order_number ? String(order.order_number) : order?.id ? shortId(String(order.id)) : null

  return (
    <div className="pt-28 lg:pt-36 pb-20 px-6 md:px-10 max-w-3xl mx-auto">
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Pedido</p>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Gracias</h1>
      <p className="mt-6 text-sm text-muted-foreground tracking-wide">
        Hemos recibido tu pedido. En breve te enviaremos la confirmación por email.
      </p>
      {reference ? (
        <p className="mt-4 text-[11px] text-muted-foreground tracking-wide">Referencia: {reference}</p>
      ) : (
        <p className="mt-4 text-[11px] text-muted-foreground tracking-wide">
          Estamos generando tu referencia de pedido.
        </p>
      )}
      <Link
        href="/catalogo"
        className="inline-flex mt-10 border border-foreground px-8 py-3 text-[10px] tracking-[0.3em] uppercase hover:bg-foreground hover:text-background transition-colors"
        suppressHydrationWarning
      >
        Volver al catálogo
      </Link>
    </div>
  )
}

