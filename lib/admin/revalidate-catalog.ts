import { revalidatePath } from 'next/cache'

/**
 * Revalida solo páginas públicas del catálogo.
 * NUNCA uses `revalidatePath('/')` sin `'page'`: invalida todo el árbol (incl. /admin) y rompe toggles en producción.
 */
export function revalidateStorefrontCatalogPaths(collectionSlug?: string | null) {
  revalidatePath('/catalogo', 'page')
  revalidatePath('/api/catalog/snapshot', 'page')
  revalidatePath('/', 'page')
  if (collectionSlug) {
    const slug = String(collectionSlug).toLowerCase().trim()
    if (slug) revalidatePath(`/coleccion/${slug}`, 'page')
  }
}

export function revalidateCatalogPaths(collectionSlug?: string | null) {
  revalidateStorefrontCatalogPaths(collectionSlug)
  revalidatePath('/admin', 'page')
  revalidatePath('/admin/productos', 'page')
  revalidatePath('/admin/colecciones', 'page')
  if (collectionSlug) {
    const slug = String(collectionSlug).toLowerCase().trim()
    if (slug) revalidatePath(`/admin/colecciones/${slug}`, 'page')
  }
}
