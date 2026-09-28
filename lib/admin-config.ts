/** Admin de producción (siempre). */
export const ADMIN_PANEL_EMAIL = 'marebo.meri@gmail.com'

/** Admins adicionales con acceso al panel (incl. producción). */
export const ADDITIONAL_ADMIN_PANEL_EMAILS = [
  'germanbayonr@gmail.com',
  /** Alias habitual si se escribe sin «n» en «german». */
  'germabayonr@gmail.com',
] as const

export function getAdminPanelEmails(): readonly string[] {
  return [ADMIN_PANEL_EMAIL, ...ADDITIONAL_ADMIN_PANEL_EMAILS]
}

export function isAdminPanelEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return getAdminPanelEmails().some((e) => e.toLowerCase() === normalized)
}

export function isAllowedAdminLoginEmail(email: string): boolean {
  return isAdminPanelEmail(email)
}

export function adminLoginEmailsHint(): string {
  const emails = getAdminPanelEmails()
  if (emails.length <= 1) return ADMIN_PANEL_EMAIL
  return emails.join(' o ')
}

export function adminPasswordResetRedirectUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}/admin/restablecer-contrasena`
}
