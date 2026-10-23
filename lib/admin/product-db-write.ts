import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ADMIN_PRODUCT_SELECT,
  ADMIN_PRODUCT_SELECT_LEGACY,
  isMissingVariantsColumnError,
  stripVariantFields,
} from '@/lib/admin/product-db-schema'

type WriteResult = { data: Record<string, unknown> | null; error: { message: string } | null }

export async function updateProductRow(
  sb: SupabaseClient,
  id: string,
  payload: Record<string, unknown>,
): Promise<WriteResult> {
  let result = await sb.from('products').update(payload).eq('id', id).select(ADMIN_PRODUCT_SELECT).single()
  if (result.error && isMissingVariantsColumnError(result.error.message)) {
    result = await sb
      .from('products')
      .update(stripVariantFields(payload))
      .eq('id', id)
      .select(ADMIN_PRODUCT_SELECT_LEGACY)
      .single()
  }
  return {
    data: (result.data as Record<string, unknown> | null) ?? null,
    error: result.error,
  }
}

export async function insertProductRow(
  sb: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<WriteResult & { id?: string }> {
  let result = await sb.from('products').insert(payload).select('id').single()
  if (result.error && isMissingVariantsColumnError(result.error.message)) {
    result = await sb.from('products').insert(stripVariantFields(payload)).select('id').single()
  }
  if (result.error) {
    return { data: null, error: result.error }
  }
  const id = result.data ? String((result.data as { id: string }).id) : undefined
  if (!id) {
    return { data: null, error: { message: 'Insert OK pero sin id devuelto' } }
  }
  let full = await sb.from('products').select(ADMIN_PRODUCT_SELECT).eq('id', id).single()
  if (full.error && isMissingVariantsColumnError(full.error.message)) {
    full = await sb.from('products').select(ADMIN_PRODUCT_SELECT_LEGACY).eq('id', id).single()
  }
  if (full.error) {
    return {
      data: null,
      error: null,
      id,
    }
  }
  return {
    data: (full.data as Record<string, unknown> | null) ?? null,
    error: null,
    id,
  }
}
