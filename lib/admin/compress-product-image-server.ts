import sharp from 'sharp'

const MAX_WIDTH = 960
const MAX_HEIGHT = 1200
const WEBP_QUALITY = 78

/** Comprime en servidor (Sharp) antes de subir a Supabase Storage: WebP, EXIF y menor peso. */
export async function compressProductImageBuffer(input: Buffer): Promise<Buffer> {
  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4, smartSubsample: true })
    .toBuffer()

  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height || meta.format !== 'webp') {
    throw new Error('La imagen comprimida no es válida')
  }
  return buffer
}
