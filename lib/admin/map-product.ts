import type { AdminProduct } from '@/lib/admin/types'

export function mapProductRow(p: Record<string, unknown>): AdminProduct {
  return {
    id: String(p.id),
    name: String(p.name ?? ''),
    price: Number(p.price) || 0,
    original_price: p.original_price != null ? Number(p.original_price) : null,
    discount_percent: Number(p.discount_percent) || 0,
    category: (p.category as string) ?? null,
    image_url: (p.image_url as string) ?? null,
    is_new_arrival: Boolean(p.is_new_arrival),
    in_stock: typeof p.in_stock === 'boolean' ? p.in_stock : true,
    is_active: typeof p.is_active === 'boolean' ? p.is_active : true,
    stripe_price_id: (p.stripe_price_id as string) ?? null,
    description: (p.description as string) ?? null,
  }
}
