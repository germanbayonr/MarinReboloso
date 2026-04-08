export type AdminProduct = {
  id: string
  name: string
  price: number
  original_price: number | null
  discount_percent: number
  category: string | null
  /** Slug de colección (ej. descara, marebo); null si no aplica */
  collection: string | null
  image_url: string | null
  is_new_arrival: boolean
  in_stock: boolean
  /** Si false, no se muestra en catálogo público */
  is_active: boolean
  stripe_price_id: string | null
  description: string | null
}

export const ORDER_STATUSES = [
  'pendiente',
  'preparando',
  'enviado',
  'entregado',
  'cancelado',
  'reembolsado',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type AdminOrder = {
  id: string
  created_at: string
  updated_at: string
  status: string
  customer_email: string | null
  customer_name: string | null
  stripe_session_id: string | null
  /** Importe total en unidad de moneda (ej. EUR), no céntimos */
  total_amount: number | null
  currency: string
  line_summary: string | null
  items_json: unknown
  shipping_address?: string | null
  shipping_city?: string | null
  shipping_postal_code?: string | null
  shipping_country?: string | null
  /** correos | packlink — rellenado al marcar como enviado */
  shipping_carrier?: string | null
  tracking_number?: string | null
  packlink_url?: string | null
  shipping_cents?: number | null
}

export type AdminCustomer = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  shipping_address: string | null
  created_at: string
}

