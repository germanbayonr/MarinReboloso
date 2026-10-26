import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
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

async function readUploadFileBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(new Uint8Array(arrayBuffer))
}

function sniffImage(buffer: Buffer): { contentType: string; extension: string } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: 'jpg' }
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { contentType: 'image/png', extension: 'png' }
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { contentType: 'image/webp', extension: 'webp' }
  }
  return null
}

async function prepareImageBuffer(
  rawBuffer: Buffer,
  folder: AdminImageStorageFolder,
  fileName: string,
): Promise<{ buffer: Buffer; contentType: string; extension: string } | { error: string }> {
  try {
    const [{ compressCollectionHeroImageBuffer, compressProductImageBuffer }, { verifyDecodableImageBuffer }] =
      await Promise.all([
        import('@/lib/admin/compress-product-image-server'),
        import('@/lib/admin/verify-image-buffer'),
      ])
    const integrity = await verifyDecodableImageBuffer(rawBuffer)
    if (!integrity.ok) return { error: integrity.error }
    const compress = folder === 'collections' ? compressCollectionHeroImageBuffer : compressProductImageBuffer
    const buffer = await compress(rawBuffer)
    return { buffer, contentType: 'image/webp', extension: 'webp' }
  } catch (error) {
    const sniffed = sniffImage(rawBuffer)
    if (sniffed) {
      console.warn(
        '[admin upload] Sharp no pudo optimizar; se sube el archivo original:',
        error instanceof Error ? error.message : error,
      )
      return { buffer: rawBuffer, ...sniffed }
    }
    const message = error instanceof Error ? error.message : adminImageCompressFailedError(fileName)
    return { error: message }
  }
}

async function verifyPublicImageUrl(publicUrl: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(publicUrl, { method: 'HEAD', cache: 'no-store' })
    if (response.ok) return { ok: true }
    return {
      ok: false,
      error: `La imagen subida no es accesible aún (HTTP ${response.status}). Revisa que el bucket product-images sea público.`,
    }
  } catch {
    return { ok: false, error: 'No se pudo verificar la imagen subida en Storage.' }
  }
}

export async function uploadOptimizedAdminImages(
  sb: SupabaseClient,
  files: File[],
  folder: AdminImageStorageFolder,
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const imageUrls: string[] = []

  for (const file of files) {
    const fileCheck = validateAdminImageFile(file)
    if (!fileCheck.ok) return fileCheck

    const rawBuffer = await readUploadFileBuffer(file)
    const sizeCheck = validateAdminImageBufferSize(rawBuffer, file.name)
    if (!sizeCheck.ok) return sizeCheck

    const prepared = await prepareImageBuffer(rawBuffer, folder, file.name)
    if ('error' in prepared) return { ok: false, error: prepared.error }

    const fileName = `${randomUUID()}.${prepared.extension}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await sb.storage.from(PRODUCT_IMAGES_BUCKET).upload(
      filePath,
      new Uint8Array(prepared.buffer),
      {
        contentType: prepared.contentType,
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
      console.warn('[admin upload] Verificación HTTP falló; se conserva el fichero subido:', verified.error, publicUrl)
    }

    imageUrls.push(publicUrl)
  }

  return { ok: true, urls: imageUrls }
}
