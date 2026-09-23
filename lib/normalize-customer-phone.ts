/** Normaliza teléfono para guardar (E.164 simplificado sin espacios). */
export function normalizeCustomerPhone(raw: string | null | undefined): string | null {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return null

  let digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 9 && /^[6789]/.test(digits)) digits = `34${digits}`

  if (digits.length < 9) return null
  return `+${digits}`
}

export function isValidCustomerPhone(raw: string | null | undefined): boolean {
  return normalizeCustomerPhone(raw) != null
}
