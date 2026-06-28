import { adminUploadProductImages } from '@/app/admin/actions'
import { validateAdminImageFile } from '@/lib/admin/admin-image-upload-policy'

/** Sube imágenes al servidor; la optimización WebP ocurre solo en servidor (Sharp). */
export async function uploadProductImagesToSupabase(
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: false, error: 'No hay archivos' }

  const formData = new FormData()
  for (const file of files) {
    const check = validateAdminImageFile(file)
    if (!check.ok) return check
    formData.append('images', file, file.name || 'upload.jpg')
  }

  if (!formData.getAll('images').length) return { ok: false, error: 'Selecciona imágenes válidas' }
  return adminUploadProductImages(formData)
}

export { validateAdminImageFile } from '@/lib/admin/admin-image-upload-policy'
