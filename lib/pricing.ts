/** Precio final (€) a partir del precio original y el % de descuento (0–100). */
export function computeFinalPrice(originalPrice: number, discountPercent: number): number {
  const o = Number(originalPrice)
  const d = Math.min(100, Math.max(0, Number(discountPercent) || 0))
  if (!Number.isFinite(o) || o < 0) return 0
  const final = o * (1 - d / 100)
  return Math.round(final * 100) / 100
}

export function hasActiveDiscount(originalPrice: number | null | undefined, discountPercent: number | null | undefined): boolean {
  const d = Number(discountPercent) || 0
  const o = Number(originalPrice) || 0
  if (d <= 0 || o <= 0) return false
  const final = computeFinalPrice(o, d)
  return final < o
}
