export const ADMIN_IMAGE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ADMIN_IMAGE_MAX_UPLOAD_MB = 10

export function formatAdminImageSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function adminImageTooLargeError(fileName?: string): string {
  const label = fileName?.trim() ? `"${fileName.trim()}"` : 'El archivo'
  return `${label} supera el límite de ${ADMIN_IMAGE_MAX_UPLOAD_MB} MB. Reduce el tamaño o elige otra imagen.`
}

export function adminImageInvalidTypeError(fileName?: string): string {
  const label = fileName?.trim() ? `"${fileName.trim()}"` : 'El archivo'
  return `${label} no es una imagen válida. Usa JPG, PNG o WebP.`
}

export function adminImageCompressFailedError(fileName?: string): string {
  const label = fileName?.trim() ? `"${fileName.trim()}"` : 'La imagen'
  return `No se pudo optimizar ${label}. Usa JPG o PNG y vuelve a subirla.`
}

export function validateAdminImageFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')) {
    return {
      ok: false,
      error: 'Las fotos HEIC del iPhone no se pueden subir. En el iPhone: Ajustes → Cámara → Formatos → Más compatible, o exporta la foto como JPG.',
    }
  }
  if (!type.startsWith('image/')) {
    return { ok: false, error: adminImageInvalidTypeError(file.name) }
  }
  if (file.size > ADMIN_IMAGE_MAX_UPLOAD_BYTES) {
    return { ok: false, error: adminImageTooLargeError(file.name) }
  }
  if (file.size === 0) {
    return { ok: false, error: 'El archivo está vacío.' }
  }
  return { ok: true }
}

export function validateAdminImageBufferSize(
  buffer: Buffer,
  fileName?: string,
): { ok: true } | { ok: false; error: string } {
  if (buffer.length === 0) {
    return { ok: false, error: 'Uno de los archivos está vacío.' }
  }
  if (buffer.length > ADMIN_IMAGE_MAX_UPLOAD_BYTES) {
    return { ok: false, error: adminImageTooLargeError(fileName) }
  }
  return { ok: true }
}
