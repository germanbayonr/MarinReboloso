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

/**
 * @deprecated El panel admin actualiza estado en el cliente; no revalidar rutas /admin tras mutaciones.
 * Usa `revalidateStorefrontCatalogPaths` desde API routes o tras cambios que afecten solo la tienda.
 */
export function revalidateCatalogPaths(collectionSlug?: string | null) {
  revalidateStorefrontCatalogPaths(collectionSlug)
}
