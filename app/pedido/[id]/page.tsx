export const dynamic = 'force-dynamic'
export const revalidate = 0

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { parseOrderItemsJson } from '@/lib/order-items-display'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
}

const STATUS_BADGE: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-900 border-amber-200',
  preparando: 'bg-violet-50 text-violet-900 border-violet-200',
  enviado: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  entregado: 'bg-green-50 text-green-900 border-green-200',
  cancelado: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  reembolsado: 'bg-orange-50 text-orange-900 border-orange-200',
}

function shortRefFromUuid(id: string): string {
  return id.replace(/-/g, '').slice(0, 10).toUpperCase()
}

function formatMoney(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null || !Number.isFinite(amount)) return '—'
  const c = (currency ?? 'eur').trim() || 'eur'
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: c.toUpperCase() }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${c}`
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ref = UUID_RE.test(id) ? shortRefFromUuid(id) : 'Pedido'
  return {
    title: `Pedido ${ref} · Marebo`,
    description: 'Seguimiento de tu pedido en Marebo Jewelry.',
  }
}

export default async function PedidoSeguimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    notFound()
  }

  const supabase = createSupabaseServerClient()
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()

  if (error || !order) {
    notFound()
  }

  const row = order as Record<string, unknown>
  const status = String(row.status ?? 'pendiente')
  const items = parseOrderItemsJson(row.items_json)
  const currency = row.currency != null ? String(row.currency) : 'eur'
  const totalAmount =
    typeof row.total_amount === 'number' && Number.isFinite(row.total_amount)
      ? row.total_amount
      : row.total_amount != null
        ? Number(row.total_amount)
        : null

  const addr = [row.shipping_address, row.shipping_postal_code, row.shipping_city, row.shipping_country]
    .map((x) => (x != null ? String(x).trim() : ''))
    .filter(Boolean)
  const addressLine = addr.length > 0 ? addr.join(' · ') : null

  const badgeClass = STATUS_BADGE[status] ?? 'bg-secondary text-secondary-foreground border-border'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background px-4 py-12 md:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-2">
            Seguimiento
          </p>
          <h1 className="font-serif text-2xl md:text-3xl tracking-wide text-foreground mb-2">
            Tu pedido
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Referencia <span className="font-mono text-foreground">{shortRefFromUuid(id)}</span>
          </p>

          <div
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium mb-10 ${badgeClass}`}
          >
            {STATUS_LABEL[status] ?? status}
          </div>

          <section className="border border-border rounded-lg p-5 md:p-6 mb-8">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Productos
            </h2>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {row.line_summary != null && String(row.line_summary).trim()
                  ? String(row.line_summary)
                  : 'Sin detalle de artículos.'}
              </p>
            ) : (
              <ul className="space-y-4">
                {items.map((line, i) => (
                  <li key={i} className="flex gap-4 border-b border-border/80 pb-4 last:border-0 last:pb-0">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded border border-border bg-muted/40">
                      {line.imageUrl && /^https?:\/\//i.test(line.imageUrl) ? (
                        <Image
                          src={line.imageUrl}
                          alt=""
                          width={56}
                          height={56}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug">{line.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Cantidad: {line.quantity}</p>
                      {line.lineTotal != null && Number.isFinite(line.lineTotal) && (
                        <p className="text-sm text-foreground mt-1">
                          {formatMoney(line.lineTotal, currency)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-border rounded-lg p-5 md:p-6 mb-8">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Total
            </h2>
            <p className="font-serif text-2xl text-foreground">{formatMoney(totalAmount, currency)}</p>
          </section>

          <section className="border border-border rounded-lg p-5 md:p-6 mb-10">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Dirección de envío
            </h2>
            {addressLine ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{addressLine}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No consta dirección en este pedido.</p>
            )}
          </section>

          <p className="text-xs text-muted-foreground text-center">
            Guarda este enlace para consultar el estado cuando quieras.{' '}
            <Link href="/catalogo" className="underline text-foreground hover:text-accent">
              Volver a la tienda
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
