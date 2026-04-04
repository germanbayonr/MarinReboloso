/** Líneas de pedido para UI (p. ej. página pública /pedido/[id]). */
export type OrderLineDisplay = {
  name: string
  quantity: number
  lineTotal: number | null
  imageUrl: string | null
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

/** Interpreta items_json de public.orders (misma lógica flexible que correos). */
export function parseOrderItemsJson(itemsJson: unknown): OrderLineDisplay[] {
  if (!itemsJson || !Array.isArray(itemsJson)) return []
  return itemsJson
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null
      const o = raw as Record<string, unknown>
      const name =
        (typeof o.name === 'string' && o.name) ||
        (typeof o.product_name === 'string' && o.product_name) ||
        (typeof o.title === 'string' && o.title) ||
        'Producto'
      const quantityRaw = num(o.quantity) ?? num(o.qty) ?? 1
      const quantity = Math.max(1, Math.min(999, Math.round(quantityRaw)))
      const imageUrl =
        (typeof o.image_url === 'string' && o.image_url) ||
        (typeof o.imageUrl === 'string' && o.imageUrl) ||
        (typeof o.image === 'string' && o.image) ||
        null
      let lineTotal: number | null = null
      if (num(o.line_total) != null) lineTotal = num(o.line_total)
      else if (num(o.price) != null) lineTotal = num(o.price)! * quantity
      return { name, quantity, lineTotal, imageUrl }
    })
    .filter((x): x is OrderLineDisplay => Boolean(x))
}
