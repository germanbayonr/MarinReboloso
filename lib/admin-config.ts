/** Admin de producción (siempre). */
export const ADMIN_PANEL_EMAIL = 'marebo.meri@gmail.com'

/** Admins extra solo en desarrollo / preview (no en producción Vercel). */
export const DEV_ADMIN_PANEL_EMAILS = ['germanbayonr@gmail.com'] as const

export function isDevAdminEnvironment(): boolean {
  if (process.env.NODE_ENV === 'development') return true
  if (process.env.NEXT_PUBLIC_DEV_ADMIN === 'true') return true
  if (process.env.VERCEL_ENV === 'preview') return true
  return false
}

export function getAdminPanelEmails(): readonly string[] {
  if (isDevAdminEnvironment()) {
    return [ADMIN_PANEL_EMAIL, ...DEV_ADMIN_PANEL_EMAILS]
  }
  return [ADMIN_PANEL_EMAIL]
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
