import type { AdminOrder } from '@/lib/admin/types'
import { getServiceSupabase } from '@/lib/admin/server'
import type { OrderConfirmationLine } from '@/lib/mail/templates'

type ParsedLine = {
  productId: string | null
  name: string
  quantity: number
  imageUrl: string | null
  lineTotalCents: number | null
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseItemsJson(items_json: unknown): ParsedLine[] {
  if (!items_json || !Array.isArray(items_json)) return []
  return items_json
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null
      const o = raw as Record<string, unknown>
      const idRaw = o.id ?? o.product_id
      let productId: string | null = null
      if (typeof idRaw === 'string' && UUID_RE.test(idRaw)) productId = idRaw

      const name =
        (typeof o.name === 'string' && o.name) ||
        (typeof o.product_name === 'string' && o.product_name) ||
        (typeof o.title === 'string' && o.title) ||
        'Pieza'
      const quantityRaw = num(o.quantity) ?? num(o.qty) ?? 1
      const quantity = Math.max(1, Math.min(999, Math.round(quantityRaw)))
      const imageUrl =
        (typeof o.image_url === 'string' && o.image_url) ||
        (typeof o.imageUrl === 'string' && o.imageUrl) ||
        (typeof o.image === 'string' && o.image) ||
        null

      const lineTotalCents =
        num(o.line_total) != null
          ? Math.round(num(o.line_total)! * 100)
          : num(o.price) != null
            ? Math.round(num(o.price)! * 100)
            : (num(o.line_total_cents) ??
                num(o.amount_cents) ??
                (num(o.unit_amount_cents) != null ? Math.round(num(o.unit_amount_cents)! * quantity) : null) ??
                (num(o.unit_price_cents) != null ? Math.round(num(o.unit_price_cents)! * quantity) : null) ??
                (num(o.price_cents) != null ? Math.round(num(o.price_cents)! * quantity) : null))

      return {
        productId,
        name,
        quantity,
        imageUrl,
        lineTotalCents: lineTotalCents != null ? Math.round(lineTotalCents) : null,
      }
    })
    .filter((x): x is ParsedLine => Boolean(x))
}

function orderShippingCents(order: AdminOrder): number | null {
  const r = order as AdminOrder & { shipping_cents?: number | null }
  return typeof r.shipping_cents === 'number' ? r.shipping_cents : null
}

type ProductRow = {
  id: string
  name: string | null
  price: unknown
  image_url: string | null
}

/**
 * Enlaza cada línea con `public.products` (nombre e imagen actuales de la tienda).
 */
async function enrichLinesWithProducts(parsed: ParsedLine[]): Promise<ParsedLine[]> {
  const ids = Array.from(
    new Set(parsed.map((p) => p.productId).filter((id): id is string => Boolean(id))),
  )
  if (ids.length === 0) return parsed

  const sb = getServiceSupabase()
  const { data: rows, error } = await sb
    .from('products')
    .select('id,name,price,image_url')
    .in('id', ids)

  if (error) {
    console.warn('[mail] enrichLinesWithProducts:', error.message)
    return parsed
  }

  const map = new Map<string, ProductRow>()
  for (const r of rows ?? []) {
    const row = r as ProductRow
    if (row?.id) map.set(String(row.id), row)
  }

  return parsed.map((p) => {
    if (!p.productId) return p
    const pr = map.get(p.productId)
    if (!pr) return p
    const name = typeof pr.name === 'string' && pr.name.trim() ? pr.name.trim() : p.name
    const img =
      typeof pr.image_url === 'string' && pr.image_url.trim() ? pr.image_url.trim() : p.imageUrl
    let lineTotalCents = p.lineTotalCents
    if (lineTotalCents == null && pr.price != null) {
      const unit = typeof pr.price === 'number' ? pr.price : Number(pr.price)
      if (Number.isFinite(unit)) lineTotalCents = Math.round(unit * 100) * p.quantity
    }
    return {
      ...p,
      name,
      imageUrl: img,
      lineTotalCents,
    }
  })
}

export type OrderEmailLinesResult = {
  lines: OrderConfirmationLine[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  currency: string
}

/**
 * Construye las líneas para plantillas de correo: datos de `items_json` + catálogo real en Supabase.
 */
export async function buildOrderLinesForEmail(order: AdminOrder): Promise<OrderEmailLinesResult> {
  const currency = (order.currency || 'eur').trim() || 'eur'
  const totalEur =
    typeof order.total_amount === 'number' && Number.isFinite(order.total_amount)
      ? order.total_amount
      : 0
  const totalCents = Math.round(totalEur * 100)
  let parsed = parseItemsJson(order.items_json)
  parsed = await enrichLinesWithProducts(parsed)
  const shippingStored = orderShippingCents(order)

  const priced = parsed.filter((p) => p.lineTotalCents != null)
  if (priced.length === parsed.length && parsed.length > 0) {
    const subtotalCents = priced.reduce((s, p) => s + (p.lineTotalCents as number), 0)
    const shippingCents =
      shippingStored != null && shippingStored >= 0
        ? shippingStored
        : Math.max(0, totalCents - subtotalCents)
    const lines: OrderConfirmationLine[] = parsed.map((p) => ({
      imageUrl: p.imageUrl,
      name: p.name,
      quantity: p.quantity,
      lineTotalCents: p.lineTotalCents ?? 0,
    }))
    const sumOrder = subtotalCents + shippingCents
    return {
      lines,
      subtotalCents,
      shippingCents,
      totalCents: totalCents > 0 ? totalCents : sumOrder,
      currency,
    }
  }

  if (parsed.length > 0) {
    const label = parsed.map((p) => `${p.name} ×${p.quantity}`).join(' · ')
    const lines: OrderConfirmationLine[] = [
      {
        imageUrl: parsed[0]?.imageUrl ?? null,
        name: label.length > 200 ? `${label.slice(0, 197)}…` : label,
        quantity: 1,
        lineTotalCents: Math.max(0, totalCents),
      },
    ]
    return {
      lines,
      subtotalCents: Math.max(0, totalCents),
      shippingCents: 0,
      totalCents: Math.max(0, totalCents),
      currency,
    }
  }

  const summary = order.line_summary?.trim() || 'Tu selección'
  return {
    lines: [
      {
        imageUrl: null,
        name: summary,
        quantity: 1,
        lineTotalCents: Math.max(0, totalCents),
      },
    ],
    subtotalCents: Math.max(0, totalCents),
    shippingCents: 0,
    totalCents: Math.max(0, totalCents),
    currency,
  }
}
