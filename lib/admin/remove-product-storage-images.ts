import type { SupabaseClient } from '@supabase/supabase-js'

const PUBLIC_PREFIX = '/storage/v1/object/public/'

/**
 * A partir de URLs públicas de Supabase Storage, agrupa rutas de objeto por bucket
 * para `storage.from(bucket).remove(paths)`.
 * Ignora URLs que no sean de ese formato (p. ej. Bunny CDN).
 */
export function objectPathsByBucketFromPublicUrls(urls: string[]): Map<string, string[]> {
  const bucketToPaths = new Map<string, Set<string>>()
  for (const raw of urls) {
    const u = raw.trim()
    if (!u) continue
    let parsed: URL
    try {
      parsed = new URL(u)
    } catch {
      continue
    }
    const idx = parsed.pathname.indexOf(PUBLIC_PREFIX)
    if (idx === -1) continue
    const after = parsed.pathname.slice(idx + PUBLIC_PREFIX.length)
    const slash = after.indexOf('/')
    if (slash === -1) continue
    const bucket = decodeURIComponent(after.slice(0, slash))
    const path = decodeURIComponent(after.slice(slash + 1))
    if (!bucket || !path) continue
    if (!bucketToPaths.has(bucket)) bucketToPaths.set(bucket, new Set())
    bucketToPaths.get(bucket)!.add(path)
  }
  const out = new Map<string, string[]>()
  for (const [bucket, set] of bucketToPaths) out.set(bucket, [...set])
  return out
}

export async function removeProductImagesFromSupabaseStorage(
  sb: SupabaseClient,
  urls: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const byBucket = objectPathsByBucketFromPublicUrls(urls)
  if (byBucket.size === 0) return { ok: true }
  for (const [bucket, paths] of byBucket) {
    if (paths.length === 0) continue
    const { error } = await sb.storage.from(bucket).remove(paths)
    if (error) return { ok: false, error: error.message }
  }
  return { ok: true }
}
