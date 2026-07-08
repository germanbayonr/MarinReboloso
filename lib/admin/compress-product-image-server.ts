import sharp from 'sharp'
import { verifyDecodableImageBuffer } from '@/lib/admin/verify-image-buffer'

const PRODUCT_MAX_WIDTH = 960
const PRODUCT_MAX_HEIGHT = 1200
const HERO_MAX_WIDTH = 1920
const HERO_MAX_HEIGHT = 2400
const PRODUCT_WEBP_QUALITY = 78
const HERO_WEBP_QUALITY = 82

async function compressImageBuffer(
  input: Buffer,
  maxWidth: number,
  maxHeight: number,
  quality: number,
): Promise<Buffer> {
  const inputCheck = await verifyDecodableImageBuffer(input)
  if (!inputCheck.ok) throw new Error(inputCheck.error)

  const buffer = await sharp(input, { failOn: 'error' })
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality, effort: 4, smartSubsample: true })
    .toBuffer()

  const outputCheck = await verifyDecodableImageBuffer(buffer)
  if (!outputCheck.ok) throw new Error(outputCheck.error)

  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height || meta.format !== 'webp') {
    throw new Error('La imagen comprimida no es válida')
  }
  return buffer
}

/** Comprime en servidor (Sharp) antes de subir productos a Supabase Storage. */
export async function compressProductImageBuffer(input: Buffer): Promise<Buffer> {
  return compressImageBuffer(input, PRODUCT_MAX_WIDTH, PRODUCT_MAX_HEIGHT, PRODUCT_WEBP_QUALITY)
}

/** Portadas de colección: más resolución para hero en home y ficha. */
export async function compressCollectionHeroImageBuffer(input: Buffer): Promise<Buffer> {
  return compressImageBuffer(input, HERO_MAX_WIDTH, HERO_MAX_HEIGHT, HERO_WEBP_QUALITY)
}
