import type { AdminProduct } from '@/lib/admin/types'

/** Más reciente primero; sin fecha al final. */
export function sortProductsByCreatedAtDesc(products: AdminProduct[]): AdminProduct[] {
  return [...products].sort((a, b) => {
    if (a.created_at && b.created_at) return b.created_at.localeCompare(a.created_at)
    if (a.created_at) return -1
    if (b.created_at) return 1
    return 0
  })
}
