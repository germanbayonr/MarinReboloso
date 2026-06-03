import { getHiddenCollectionSlugs, productCollectionMatchesSlug } from '@/lib/collections'

export interface ProductWithCollection {
  collection?: string | null
}

let hiddenSlugsCache: Set<string> | null = null

export async function getHiddenCollectionSlugSet(): Promise<Set<string>> {
  if (!hiddenSlugsCache) hiddenSlugsCache = await getHiddenCollectionSlugs()
  return hiddenSlugsCache
}

export function clearHiddenCollectionSlugCache() {
  hiddenSlugsCache = null
}

export async function isProductInHiddenCollection(product: ProductWithCollection): Promise<boolean> {
  const hidden = await getHiddenCollectionSlugSet()
  const slug = (product.collection ?? '').trim().toLowerCase()
  if (!slug) return false
  for (const hiddenSlug of hidden) {
    if (productCollectionMatchesSlug(slug, hiddenSlug)) return true
  }
  return false
}

export async function filterProductsByCollectionVisibility<T extends ProductWithCollection>(
  products: T[],
): Promise<T[]> {
  const hidden = await getHiddenCollectionSlugSet()
  if (hidden.size === 0) return products
  return products.filter((p) => {
    const slug = (p.collection ?? '').trim().toLowerCase()
    if (!slug) return true
    for (const hiddenSlug of hidden) {
      if (productCollectionMatchesSlug(slug, hiddenSlug)) return false
    }
    return true
  })
}
