import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { compressProductImageBuffer } from '@/lib/admin/compress-product-image-server'
import {
  adminImageCompressFailedError,
  validateAdminImageBufferSize,
  validateAdminImageFile,
} from '@/lib/admin/admin-image-upload-policy'
import { STORAGE_IMMUTABLE_CACHE_CONTROL } from '@/lib/image-delivery'
import {
  isLikelyRowLevelSecurityMessage,
  RLS_BLOCK_USER_MESSAGE,
} from '@/lib/admin/supabase-admin-log'

export const PRODUCT_IMAGES_BUCKET = 'product-images'

export type AdminImageStorageFolder = 'products' | 'collections'

export async function uploadOptimizedAdminImages(
  sb: SupabaseClient,
  files: File[],
  folder: AdminImageStorageFolder,
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const imageUrls: string[] = []

  for (const file of files) {
    const fileCheck = validateAdminImageFile(file)
    if (!fileCheck.ok) return fileCheck

    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const sizeCheck = validateAdminImageBufferSize(rawBuffer, file.name)
    if (!sizeCheck.ok) return sizeCheck

    let buffer: Buffer
    try {
      buffer = await compressProductImageBuffer(rawBuffer)
    } catch {
      return { ok: false, error: adminImageCompressFailedError(file.name) }
    }

    const fileName = `${randomUUID()}.webp`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await sb.storage.from(PRODUCT_IMAGES_BUCKET).upload(filePath, buffer, {
      contentType: 'image/webp',
      cacheControl: STORAGE_IMMUTABLE_CACHE_CONTROL,
      upsert: false,
    })

    if (uploadError) {
      if (isLikelyRowLevelSecurityMessage(uploadError.message)) {
        return { ok: false, error: `${RLS_BLOCK_USER_MESSAGE}${uploadError.message}` }
      }
      return { ok: false, error: uploadError.message }
    }

    const { data: publicData } = sb.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath)
    const publicUrl = publicData?.publicUrl?.trim()
    if (!publicUrl) {
      return { ok: false, error: 'No se pudo obtener la URL pública de la imagen en Storage.' }
    }
    imageUrls.push(publicUrl)
  }

  return { ok: true, urls: imageUrls }
}
