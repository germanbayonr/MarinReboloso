import { revalidatePath } from 'next/cache'

export function revalidateCatalogPaths(collectionSlug?: string | null) {
  revalidatePath('/admin')
  revalidatePath('/admin/productos')
  revalidatePath('/admin/colecciones')
  revalidatePath('/catalogo')
  revalidatePath('/api/catalog/snapshot')
  revalidatePath('/')
  if (collectionSlug) {
    revalidatePath(`/coleccion/${collectionSlug}`)
    revalidatePath(`/admin/colecciones/${collectionSlug}`)
  }
}
