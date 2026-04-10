/**
 * La columna `products.image_url` en Postgres es `text[]`; PostgREST espera un array JS, no un string suelto.
 */

export function imageUrlsForDatabaseColumn(input: {
  image_url: string | null
  image_urls?: string[] | null
}): string[] | null {
  if (input.image_urls != null && input.image_urls.length > 0) {
    const urls = input.image_urls.map((u) => String(u).trim()).filter(Boolean)
    return urls.length ? urls : null
  }
  if (input.image_url != null && String(input.image_url).trim()) {
    return [String(input.image_url).trim()]
  }
  return null
}

export function imageUrlFirstFromDatabase(raw: unknown): string | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw.find((u) => typeof u === 'string' && u.trim())
    return first ? String(first).trim() : null
  }
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t || null
  }
  return null
}

/** Todas las URLs guardadas en `text[]` o un único string (p. ej. al borrar archivos en Storage). */
export function allImageUrlsFromDatabase(raw: unknown): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === 'string' && u.trim()).map((u) => u.trim())
  }
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()]
  return []
}
