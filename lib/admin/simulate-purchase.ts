/** Payload de ejemplo para simulateRealPurchase (texto de envío + líneas con importes en céntimos). */
export const SIMULATED_LINE_SUMMARY =
  'Envío: C/ Gran Vía 28, 5º B · 28013 Madrid (ES) — Collar oro + Pendientes perla cultivada'

export const SIMULATED_ITEMS_JSON = [
  {
    name: 'Collar oro minimalista',
    quantity: 1,
    line_total: 70,
    image_url: null as string | null,
  },
  {
    name: 'Pendientes perla cultivada',
    quantity: 1,
    line_total: 50,
    image_url: null as string | null,
  },
] as const
