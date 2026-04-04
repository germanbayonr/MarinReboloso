/**
 * URL absoluta del sitio en producción (emails, enlaces de seguimiento).
 *
 * En Vercel / producción define: NEXT_PUBLIC_SITE_URL=https://marebo.es (sin barra final).
 * Si no está definida, se usa https://marebo.es.
 * En producción nunca se usará un host local aunque la variable apunte a localhost por error.
 */
const DEFAULT_SITE = 'https://marebo.es'

function isLocalHost(url: string) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url)
}

export function getPublicSiteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')?.trim() || ''

  if (!raw) {
    return DEFAULT_SITE
  }

  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'

  if (isProd && isLocalHost(raw)) {
    console.warn(
      '[site-url] NEXT_PUBLIC_SITE_URL apunta a un host local en producción; usando',
      DEFAULT_SITE,
    )
    return DEFAULT_SITE
  }

  if (!/^https?:\/\//i.test(raw)) {
    return `https://${raw.replace(/^\/+/, '')}`
  }

  return raw
}

/** Página de seguimiento de pedido (invitado, con el UUID en la URL). */
export function getOrderTrackingPageUrl(orderId: string): string {
  const id = orderId.trim()
  if (!id) return `${getPublicSiteBaseUrl()}/catalogo`
  return `${getPublicSiteBaseUrl()}/pedido/${encodeURIComponent(id)}`
}

/** Área de cuenta / perfil (enlaces en pie de correo). */
export function getPublicMiCuentaUrl(): string {
  return `${getPublicSiteBaseUrl()}/mi-cuenta`
}
