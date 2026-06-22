import type { SiteCatalogSnapshot } from '@/lib/catalog-snapshot'

const STORAGE_KEY = 'marebo:site-catalog:v1'
const TTL_MS = 10 * 60 * 1000

interface CachedPayload {
  savedAt: number
  snapshot: SiteCatalogSnapshot
}

export function readSiteCatalogCache(): SiteCatalogSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedPayload
    if (!parsed?.snapshot || Date.now() - parsed.savedAt > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed.snapshot
  } catch {
    return null
  }
}

export function writeSiteCatalogCache(snapshot: SiteCatalogSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    const payload: CachedPayload = { savedAt: Date.now(), snapshot }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // sessionStorage lleno — ignorar
  }
}

export function clearSiteCatalogCache(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
