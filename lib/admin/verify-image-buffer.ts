import sharp from 'sharp'

const UTF8_REPLACEMENT = Buffer.from([0xef, 0xbf, 0xbd])

export function countUtf8ReplacementBytes(buffer: Buffer): number {
  let count = 0
  for (let i = 0; i <= buffer.length - 3; i++) {
    if (
      buffer[i] === UTF8_REPLACEMENT[0] &&
      buffer[i + 1] === UTF8_REPLACEMENT[1] &&
      buffer[i + 2] === UTF8_REPLACEMENT[2]
    ) {
      count++
    }
  }
  return count
}

/** Detecta buffers dañados por pasar binario por texto UTF-8 (típico en uploads corruptos). */
export function isLikelyBinaryCorrupted(buffer: Buffer): boolean {
  if (buffer.length < 32) return true
  const replacements = countUtf8ReplacementBytes(buffer)
  const threshold = Math.max(24, Math.floor(buffer.length * 0.002))
  return replacements > threshold
}

export async function verifyDecodableImageBuffer(
  buffer: Buffer,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isLikelyBinaryCorrupted(buffer)) {
    return { ok: false, error: 'La imagen llegó corrupta al servidor. Vuelve a subirla (JPG o PNG).' }
  }

  try {
    const meta = await sharp(buffer, { failOn: 'error' }).metadata()
    if (!meta.width || !meta.height || !meta.format) {
      return { ok: false, error: 'La imagen no tiene dimensiones válidas.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'La imagen no se puede decodificar. Usa JPG o PNG y vuelve a subirla.' }
  }
}
