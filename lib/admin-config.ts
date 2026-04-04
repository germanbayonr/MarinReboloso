/** Único email con acceso al panel /admin (debe coincidir con Supabase Auth). */
export const ADMIN_PANEL_EMAIL = 'marebo.meri@gmail.com'

export function isAdminPanelEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === ADMIN_PANEL_EMAIL.toLowerCase()
}
