'use server'

import { assertAdminMutationContext } from '@/lib/admin/server'
import { patchAdminProductRow } from '@/lib/admin/patch-admin-product'
import { runAdminDeleteProduct, runAdminDeleteProducts } from '@/lib/admin/product-delete-server'
import { revalidateStorefrontCatalogPaths } from '@/lib/admin/revalidate-catalog'

/** Stock / visibilidad: sin revalidatePath (evita re-render RSC del panel en producción). La UI actualiza estado local. */
export async function adminSetProductStock(id: string, in_stock: boolean) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  return patchAdminProductRow(ctx.sb, id, { in_stock })
}

export async function adminSetProductCatalogVisible(id: string, is_active: boolean) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  return patchAdminProductRow(ctx.sb, id, { is_active })
}

export async function adminDeleteProduct(id: string) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const result = await runAdminDeleteProduct(ctx.sb, id)
  if (!result.ok) return result
  revalidateStorefrontCatalogPaths()
  return { ok: true as const }
}

export async function adminDeleteProducts(ids: string[]) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const result = await runAdminDeleteProducts(ctx.sb, ids)
  if (!result.ok) return result
  if (result.deletedCount > 0) revalidateStorefrontCatalogPaths()
  return { ok: true as const, deletedCount: result.deletedCount, failures: result.failures }
}

/** Opcional tras toggle: refresca tienda pública sin tocar rutas /admin. */
export async function adminRevalidateStorefrontCatalog(collectionSlug?: string | null) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  revalidateStorefrontCatalogPaths(collectionSlug)
  return { ok: true as const }
}
