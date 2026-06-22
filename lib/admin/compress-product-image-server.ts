import sharp from 'sharp'

const MAX_WIDTH = 960
const MAX_HEIGHT = 1200
const WEBP_QUALITY = 72

/** Comprime en servidor antes de subir a Supabase Storage (menor egress). */
export async function compressProductImageBuffer(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer()
}
