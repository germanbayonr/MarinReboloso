import { adminUploadProductImages } from '@/app/admin/actions'
import { compressProductImage } from '@/lib/admin/compress-product-image'

/** Sube una o varias imágenes a Supabase Storage al instante (vía server action). */
export async function uploadProductImagesToSupabase(files: File[]): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: false, error: 'No hay archivos' }

  const formData = new FormData()
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    const compressed = await compressProductImage(file)
    formData.append('images', new File([compressed], 'img.webp', { type: 'image/webp' }))
  }

  if (!formData.getAll('images').length) return { ok: false, error: 'Selecciona imágenes válidas' }
  return adminUploadProductImages(formData)
}
