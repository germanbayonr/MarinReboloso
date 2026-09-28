import { revalidatePath } from 'next/cache'

/** Solo rutas públicas (no re-renderiza el panel admin tras toggles/borrados). */
export function revalidateStorefrontCatalogPaths(collectionSlug?: string | null) {
  revalidatePath('/catalogo')
  revalidatePath('/api/catalog/snapshot')
  revalidatePath('/')
  if (collectionSlug) {
    revalidatePath(`/coleccion/${collectionSlug}`)
  }
}

export function revalidateCatalogPaths(collectionSlug?: string | null) {
  revalidateStorefrontCatalogPaths(collectionSlug)
  revalidatePath('/admin')
  revalidatePath('/admin/productos')
  revalidatePath('/admin/colecciones')
  if (collectionSlug) {
    revalidatePath(`/admin/colecciones/${collectionSlug}`)
  }
}
