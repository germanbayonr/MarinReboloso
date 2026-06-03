import type { CollectionOption } from '@/lib/collections'

/** Slugs históricos en `products.collection` (fallback si la tabla collections no existe). */
export const PRODUCT_COLLECTION_SLUGS = [
  'descara',
  'marebo',
  'corales',
  'filipa',
  'jaipur',
  'lost-in-jaipur',
] as const

export type ProductCollectionSlug = (typeof PRODUCT_COLLECTION_SLUGS)[number] | string

const LEGACY_OPTIONS: { slug: string; label: string }[] = [
  { slug: 'descara', label: 'Descará' },
  { slug: 'marebo', label: 'Marebo' },
  { slug: 'corales', label: 'Corales' },
  { slug: 'filipa', label: 'Filipa' },
  { slug: 'jaipur', label: 'Jaipur' },
  { slug: 'lost-in-jaipur', label: 'Jaipur (legacy)' },
]

export const PRODUCT_COLLECTION_OPTIONS = LEGACY_OPTIONS

export function buildProductCollectionOptions(rows: CollectionOption[]): { slug: string; label: string }[] {
  const fromDb = rows.map((r) => ({ slug: r.slug, label: r.label }))
  const seen = new Set(fromDb.map((o) => o.slug))
  const legacy = LEGACY_OPTIONS.filter((o) => !seen.has(o.slug))
  return [...fromDb, ...legacy]
}

export function isProductCollectionSlug(s: string, allowedSlugs?: Set<string>): boolean {
  const t = String(s).trim().toLowerCase()
  if (!t) return false
  if (allowedSlugs) return allowedSlugs.has(t)
  return (PRODUCT_COLLECTION_SLUGS as readonly string[]).includes(t)
}

export function normalizeProductCollectionInput(
  raw: string | null | undefined,
  allowedSlugs?: Set<string>,
): string | null {
  if (raw == null) return null
  const t = String(raw).trim().toLowerCase()
  if (!t) return null
  if (allowedSlugs) return allowedSlugs.has(t) ? t : null
  return isProductCollectionSlug(t) ? t : null
}

export function labelForCollectionSlug(slug: string | null | undefined, options?: CollectionOption[]): string {
  if (slug == null || String(slug).trim() === '') return '—'
  const s = String(slug).trim().toLowerCase()
  const list = options ?? LEGACY_OPTIONS
  const found = list.find((o) => o.slug === s)
  return found?.label ?? slug
}
