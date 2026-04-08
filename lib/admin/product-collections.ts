/** Slugs en columna `products.collection` (alineados con filtros del catálogo). */
export const PRODUCT_COLLECTION_SLUGS = [
  'descara',
  'marebo',
  'corales',
  'filipa',
  'jaipur',
  'lost-in-jaipur',
] as const

export type ProductCollectionSlug = (typeof PRODUCT_COLLECTION_SLUGS)[number]

export const PRODUCT_COLLECTION_OPTIONS: { slug: ProductCollectionSlug; label: string }[] = [
  { slug: 'descara', label: 'Descará' },
  { slug: 'marebo', label: 'Marebo' },
  { slug: 'corales', label: 'Corales' },
  { slug: 'filipa', label: 'Filipa' },
  { slug: 'jaipur', label: 'Jaipur' },
  { slug: 'lost-in-jaipur', label: 'Jaipur (legacy)' },
]

export function isProductCollectionSlug(s: string): s is ProductCollectionSlug {
  return (PRODUCT_COLLECTION_SLUGS as readonly string[]).includes(s)
}

/** Normaliza entrada del admin: solo slugs permitidos; vacío → null. */
export function normalizeProductCollectionInput(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = String(raw).trim().toLowerCase()
  if (!t) return null
  return isProductCollectionSlug(t) ? t : null
}

export function labelForCollectionSlug(slug: string | null | undefined): string {
  if (slug == null || String(slug).trim() === '') return '—'
  const s = String(slug).trim().toLowerCase()
  const found = PRODUCT_COLLECTION_OPTIONS.find((o) => o.slug === s)
  return found?.label ?? slug
}
