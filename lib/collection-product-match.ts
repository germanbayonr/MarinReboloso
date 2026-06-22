import { slugifyCollectionLabel } from '@/lib/collection-slug'
import { collectionSlugsForProductFilter, productCollectionMatchesSlug } from '@/lib/collections'

/** Normaliza el valor guardado en `products.collection` a slug. */
export function normalizeProductCollectionSlug(raw: string | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) return null
  const trimmed = String(raw).trim()
  const lower = trimmed.toLowerCase()
  if (lower === 'lost-in-jaipur' || lower === 'lost in jaipur') return 'jaipur'
  const slug = slugifyCollectionLabel(trimmed)
  return slug || lower
}

export function productMatchesCollectionSlug(
  productCollection: string | null | undefined,
  collectionSlug: string,
): boolean {
  const productSlug = normalizeProductCollectionSlug(productCollection)
  if (!productSlug) return false
  const targets = collectionSlugsForProductFilter(collectionSlug)
  return targets.some((target) => productCollectionMatchesSlug(productSlug, target))
}
