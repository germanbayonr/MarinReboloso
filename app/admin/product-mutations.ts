'use server'

import { assertAdminMutationContext } from '@/lib/admin/server'
import { fetchAdminProductById } from '@/lib/admin/fetch-admin-products'
import { revalidateCatalogPaths } from '@/lib/admin/revalidate-catalog'

export async function adminSetProductStock(id: string, in_stock: boolean) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const productId = String(id ?? '').trim()
  if (!productId) return { ok: false as const, error: 'ID de producto inválido' }

  const { error } = await ctx.sb.from('products').update({ in_stock }).eq('id', productId)
  if (error) return { ok: false as const, error: error.message }

  const product = await fetchAdminProductById(ctx.sb, productId)
  if (!product) return { ok: false as const, error: 'Producto actualizado pero no se pudo leer de nuevo' }

  revalidateCatalogPaths(product.collection)
  return { ok: true as const, product }
}

export async function adminSetProductCatalogVisible(id: string, is_active: boolean) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const productId = String(id ?? '').trim()
  if (!productId) return { ok: false as const, error: 'ID de producto inválido' }

  const { error } = await ctx.sb.from('products').update({ is_active }).eq('id', productId)
  if (error) return { ok: false as const, error: error.message }

  const product = await fetchAdminProductById(ctx.sb, productId)
  if (!product) return { ok: false as const, error: 'Producto actualizado pero no se pudo leer de nuevo' }

  revalidateCatalogPaths(product.collection)
  return { ok: true as const, product }
}
