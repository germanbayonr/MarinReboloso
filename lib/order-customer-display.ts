import type { AdminOrder } from '@/lib/admin/types'

export function formatOrderShippingLine(order: AdminOrder): string | null {
  const parts = [
    order.shipping_address?.trim(),
    order.shipping_postal_code?.trim(),
    order.shipping_city?.trim(),
    order.shipping_country?.trim(),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function formatOrderCustomerBlock(order: AdminOrder): {
  name: string
  email: string
  phone: string
  shipping: string | null
} {
  return {
    name: order.customer_name?.trim() || 'Sin nombre',
    email: order.customer_email?.trim() || 'Email desconocido',
    phone: order.customer_phone?.trim() || 'Sin teléfono',
    shipping: formatOrderShippingLine(order),
  }
}
