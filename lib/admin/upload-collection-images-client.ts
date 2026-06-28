import { adminUploadCollectionHeroImages } from '@/app/admin/collection-actions'
import { validateAdminImageFile } from '@/lib/admin/admin-image-upload-policy'

/** Sube portadas de colección al servidor; la optimización WebP ocurre en servidor (Sharp). */
export async function uploadCollectionHeroImageToSupabase(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const check = validateAdminImageFile(file)
  if (!check.ok) return check

  const formData = new FormData()
  formData.append('images', file, file.name || 'upload.jpg')
  const res = await adminUploadCollectionHeroImages(formData)
  if (!res.ok) return res
  const url = res.urls[0]
  if (!url) return { ok: false, error: 'No se obtuvo la URL de la imagen.' }
  return { ok: true, url }
}

export { validateAdminImageFile } from '@/lib/admin/admin-image-upload-policy'
