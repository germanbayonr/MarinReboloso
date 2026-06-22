import { slugifyCollectionLabel } from '@/lib/collection-slug'
import { collectionProductAliasGroup } from '@/lib/collection-slug-aliases'

/** Normaliza el valor guardado en `products.collection` a slug. */
export function normalizeProductCollectionSlug(raw: string | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) return null
  const trimmed = String(raw).trim()
  const lower = trimmed.toLowerCase()
  if (lower === 'lost-in-jaipur' || lower === 'lost in jaipur') return 'jaipur'
  const slug = slugifyCollectionLabel(trimmed)
  if (!slug) return lower
  const group = collectionProductAliasGroup(slug)
  return group[0] ?? slug
}

export function productMatchesCollectionSlug(
  productCollection: string | null | undefined,
  collectionSlug: string,
): boolean {
  const productSlug = normalizeProductCollectionSlug(productCollection)
  if (!productSlug) return false
  const targets = collectionProductAliasGroup(collectionSlug)
  const productAliases = collectionProductAliasGroup(productSlug)
  return productAliases.some((alias) => targets.includes(alias))
}
