/**
 * Decodifica el payload de un JWT Supabase sin verificar firma (solo inspección local).
 */
export function decodeSupabaseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad) b64 += '='.repeat(4 - pad)
    const json =
      typeof atob === 'function'
        ? atob(b64)
        : Buffer.from(b64, 'base64').toString('utf8')
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function jwtRoleFromSupabaseKey(key: string): string | null {
  const payload = decodeSupabaseJwtPayload(key.trim())
  if (!payload) return null
  const role = payload.role
  return typeof role === 'string' ? role : null
}
