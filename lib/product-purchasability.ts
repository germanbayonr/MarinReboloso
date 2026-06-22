import { isProductUuid } from '@/lib/shop-client-storage'

export interface PurchasabilityIssue {
  code: string
  message: string
}

export interface ProductPurchasabilityRow {
  id: string
  name: string
  price: number | string
  is_active?: boolean | null
  in_stock?: boolean | null
  stripe_product_id?: string | null
  stripe_price_id?: string | null
}

export function validateProductPurchasability(row: ProductPurchasabilityRow): PurchasabilityIssue[] {
  const issues: PurchasabilityIssue[] = []
  const id = String(row.id ?? '').trim()
  const name = String(row.name ?? '').trim()
  const price = Number(row.price)

  if (!id) issues.push({ code: 'missing_id', message: 'Sin id de producto' })
  if (!isProductUuid(id)) issues.push({ code: 'invalid_id', message: 'Id no es UUID de Supabase (no comprable online)' })
  if (!name) issues.push({ code: 'missing_name', message: 'Sin nombre' })
  if (!Number.isFinite(price) || price <= 0) issues.push({ code: 'invalid_price', message: 'Precio inválido o cero' })
  if (row.is_active === false) issues.push({ code: 'inactive', message: 'Producto inactivo' })
  if (row.in_stock === false) issues.push({ code: 'out_of_stock', message: 'Sin stock' })
  if (!row.stripe_product_id?.trim()) issues.push({ code: 'missing_stripe_product', message: 'Sin stripe_product_id' })
  if (!row.stripe_price_id?.trim()) issues.push({ code: 'missing_stripe_price', message: 'Sin stripe_price_id' })

  return issues
}

export interface StripePriceValidation {
  ok: boolean
  issue?: string
  unitAmount?: number | null
}

/** Comprueba que el price id de Stripe existe, es EUR puntual y coincide con Supabase. */
export function validateStripePriceMatch(
  expectedPriceEur: number,
  stripePrice: {
    active: boolean
    currency: string
    unit_amount: number | null
    recurring: unknown
  } | null,
): StripePriceValidation {
  if (!stripePrice) return { ok: false, issue: 'Precio no encontrado en Stripe' }
  if (!stripePrice.active) return { ok: false, issue: 'Precio inactivo en Stripe' }
  if (stripePrice.currency !== 'eur') return { ok: false, issue: `Moneda ${stripePrice.currency} (se esperaba eur)` }
  if (stripePrice.recurring) return { ok: false, issue: 'Precio recurrente (se esperaba pago único)' }
  const expected = Math.round(expectedPriceEur * 100)
  if (stripePrice.unit_amount !== expected) {
    return {
      ok: false,
      issue: `Importe Stripe ${((stripePrice.unit_amount ?? 0) / 100).toFixed(2)}€ ≠ Supabase ${expectedPriceEur.toFixed(2)}€`,
      unitAmount: stripePrice.unit_amount,
    }
  }
  return { ok: true, unitAmount: stripePrice.unit_amount }
}
