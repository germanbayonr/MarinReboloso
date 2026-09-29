import { validateAdminImageFile } from '@/lib/admin/admin-image-upload-policy'
import { uploadAdminProductImagesViaApi } from '@/lib/admin/admin-product-api-client'

/** Sube imágenes vía API admin (sin Server Actions → evita POST /admin/productos 500). */
export async function uploadProductImagesToSupabase(
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: false, error: 'No hay archivos' }

  for (const file of files) {
    const check = validateAdminImageFile(file)
    if (!check.ok) return check
  }

  try {
    const urls = await uploadAdminProductImagesViaApi(files)
    return { ok: true, urls }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudieron subir las imágenes' }
  }
}

export { validateAdminImageFile } from '@/lib/admin/admin-image-upload-policy'
