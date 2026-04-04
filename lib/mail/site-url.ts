/**
 * URL pública del sitio (emails, enlaces de seguimiento).
 * Configura NEXT_PUBLIC_SITE_URL en .env (sin barra final).
 */
export function getPublicSiteBaseUrl(): string {
  const b = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')?.trim()
  return b || 'https://marebo.es'
}

/** Página de seguimiento de pedido (invitado, con el UUID en la URL). */
export function getOrderTrackingPageUrl(orderId: string): string {
  const id = orderId.trim()
  if (!id) return `${getPublicSiteBaseUrl()}/catalogo`
  return `${getPublicSiteBaseUrl()}/pedido/${encodeURIComponent(id)}`
}
