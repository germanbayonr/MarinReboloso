import { validateAdminImageFile } from '@/lib/admin/admin-image-upload-policy'
import { uploadAdminProductImagesViaApi } from '@/lib/admin/admin-product-api-client'

/** Vercel corta el body de las funciones alrededor de 4,5 MB. Bajamos antes de salir del navegador. */
const CLIENT_UPLOAD_MAX_EDGE = 1600
const CLIENT_UPLOAD_TARGET_BYTES = 2 * 1024 * 1024

async function shrinkAdminImageForUpload(file: File): Promise<File> {
  if (file.size <= CLIENT_UPLOAD_TARGET_BYTES) return file
  if (typeof createImageBitmap !== 'function') return file

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, CLIENT_UPLOAD_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.82)
    })
    if (!blob || blob.size === 0) return file
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'producto'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    bitmap.close()
  }
}

/** Sube imágenes vía API admin (sin Server Actions → evita POST /admin/productos 500). */
export async function uploadProductImagesToSupabase(
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: false, error: 'No hay archivos' }

  const prepared: File[] = []
  for (const file of files) {
    const check = validateAdminImageFile(file)
    if (!check.ok) return check
    try {
      prepared.push(await shrinkAdminImageForUpload(file))
    } catch {
      return { ok: false, error: 'No se pudo preparar la imagen en el navegador. Usa JPG o PNG.' }
    }
  }

  try {
    const urls = await uploadAdminProductImagesViaApi(prepared)
    return { ok: true, urls }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudieron subir las imágenes' }
  }
}

export { validateAdminImageFile } from '@/lib/admin/admin-image-upload-policy'
