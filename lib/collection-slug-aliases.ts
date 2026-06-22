import { slugifyCollectionLabel } from '@/lib/collection-slug'

/** Grupos de slugs que comparten el mismo catálogo en `products.collection`. */
const COLLECTION_PRODUCT_ALIAS_GROUPS: string[][] = [
  ['marebo', 'el-joyero-de-marebo', 'el-joyero-marebo'],
  ['jaipur', 'lost-in-jaipur'],
]

function normalizeCollectionSlug(value: string): string {
  return slugifyCollectionLabel(String(value ?? '').trim())
}

export function collectionProductAliasGroup(slug: string): string[] {
  const normalized = normalizeCollectionSlug(slug)
  for (const group of COLLECTION_PRODUCT_ALIAS_GROUPS) {
    if (group.includes(normalized)) return group
  }
  return [normalized]
}

export function collectionSlugsForProductFilter(collectionSlug: string): string[] {
  return collectionProductAliasGroup(collectionSlug)
}

export function productCollectionMatchesSlug(productSlug: string, collectionSlug: string): boolean {
  const product = normalizeCollectionSlug(productSlug)
  const targets = collectionProductAliasGroup(collectionSlug)
  return targets.includes(product)
}
