import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  compressCollectionHeroImageBuffer,
  compressProductImageBuffer,
} from '@/lib/admin/compress-product-image-server'
import {
  adminImageCompressFailedError,
  validateAdminImageBufferSize,
  validateAdminImageFile,
} from '@/lib/admin/admin-image-upload-policy'
import { verifyDecodableImageBuffer } from '@/lib/admin/verify-image-buffer'
import { STORAGE_IMMUTABLE_CACHE_CONTROL } from '@/lib/image-delivery'
import {
  isLikelyRowLevelSecurityMessage,
  RLS_BLOCK_USER_MESSAGE,
} from '@/lib/admin/supabase-admin-log'

export const PRODUCT_IMAGES_BUCKET = 'product-images'

export type AdminImageStorageFolder = 'products' | 'collections'

async function readUploadFileBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(new Uint8Array(arrayBuffer))
}

async function verifyPublicImageUrl(
  publicUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let response: Response
  try {
    response = await fetch(publicUrl, { cache: 'no-store' })
  } catch {
    return { ok: false, error: 'No se pudo verificar la imagen subida en Storage.' }
  }

  if (!response.ok) {
    return { ok: false, error: `La imagen subida no es accesible (HTTP ${response.status}).` }
  }

  const downloaded = Buffer.from(new Uint8Array(await response.arrayBuffer()))
  return verifyDecodableImageBuffer(downloaded)
}

export async function uploadOptimizedAdminImages(
  sb: SupabaseClient,
  files: File[],
  folder: AdminImageStorageFolder,
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const imageUrls: string[] = []
  const compress =
    folder === 'collections' ? compressCollectionHeroImageBuffer : compressProductImageBuffer

  for (const file of files) {
    const fileCheck = validateAdminImageFile(file)
    if (!fileCheck.ok) return fileCheck

    const rawBuffer = await readUploadFileBuffer(file)
    const sizeCheck = validateAdminImageBufferSize(rawBuffer, file.name)
    if (!sizeCheck.ok) return sizeCheck

    const rawIntegrity = await verifyDecodableImageBuffer(rawBuffer)
    if (!rawIntegrity.ok) return rawIntegrity

    let buffer: Buffer
    try {
      buffer = await compress(rawBuffer)
    } catch (error) {
      const message = error instanceof Error ? error.message : adminImageCompressFailedError(file.name)
      return { ok: false, error: message }
    }

    const fileName = `${randomUUID()}.webp`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await sb.storage.from(PRODUCT_IMAGES_BUCKET).upload(
      filePath,
      new Uint8Array(buffer),
      {
        contentType: 'image/webp',
        cacheControl: STORAGE_IMMUTABLE_CACHE_CONTROL,
        upsert: false,
      },
    )

    if (uploadError) {
      if (isLikelyRowLevelSecurityMessage(uploadError.message)) {
        return { ok: false, error: `${RLS_BLOCK_USER_MESSAGE}${uploadError.message}` }
      }
      return { ok: false, error: uploadError.message }
    }

    const { data: publicData } = sb.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath)
    const publicUrl = publicData?.publicUrl?.trim()
    if (!publicUrl) {
      await sb.storage.from(PRODUCT_IMAGES_BUCKET).remove([filePath])
      return { ok: false, error: 'No se pudo obtener la URL pública de la imagen en Storage.' }
    }

    const verified = await verifyPublicImageUrl(publicUrl)
    if (!verified.ok) {
      await sb.storage.from(PRODUCT_IMAGES_BUCKET).remove([filePath])
      return verified
    }

    imageUrls.push(publicUrl)
  }

  return { ok: true, urls: imageUrls }
}
