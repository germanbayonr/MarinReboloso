import type { SupabaseClient } from '@supabase/supabase-js'
import { uploadOptimizedAdminImages } from '@/lib/admin/upload-optimized-admin-images'

export async function runUploadProductImages(
  sb: SupabaseClient,
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const valid = files.filter((x): x is File => x instanceof File && x.size > 0)
  if (valid.length === 0) return { ok: false, error: 'Selecciona al menos una imagen' }
  return uploadOptimizedAdminImages(sb, valid, 'products')
}
