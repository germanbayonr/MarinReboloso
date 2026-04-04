/**
 * Plantillas HTML Marebo — estilo premium, tablas para clientes de correo.
 */

import { getPublicSiteBaseUrl } from '@/lib/mail/site-url'

const TEXT = '#1a1a1a'
const MUTED = '#6b6b6b'
const BORDER = '#e8e8e8'
const TRACK_BG = '#f5f5f5'
const STEP_PENDING = '#e8e8e8'
const INSTAGRAM_URL = 'https://www.instagram.com/marebo_jewelry/'

const FONT_SERIF = "Georgia, 'Times New Roman', Times, serif"
const FONT_SANS =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatMoney(cents: number, currency: string): string {
  const c = currency?.trim() || 'eur'
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: c.toUpperCase(),
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${c.toUpperCase()}`
  }
}

/** Asunto sin ID: Pedido para Nombre - Etapa */
export function getOrderEmailSubject(stage: string, customerName: string): string {
  const n = customerName.trim() || 'Cliente'
  return `Pedido para ${n} - ${stage}`
}

/** Siempre URL absoluta basada en NEXT_PUBLIC_SITE_URL (vía getPublicSiteBaseUrl). */
function trackingHref(siteUrl: string, orderId?: string | null): string {
  let base = siteUrl.replace(/\/$/, '').trim() || getPublicSiteBaseUrl()
  if (!/^https?:\/\//i.test(base)) {
    base = getPublicSiteBaseUrl()
  }
  if (orderId?.trim()) return `${base}/pedido/${encodeURIComponent(orderId.trim())}`
  return `${base}/catalogo`
}

/** Cabecera global: logo textual enlazado al seguimiento del pedido. */
function logoHeaderHtml(siteUrl: string, orderId?: string | null): string {
  const href = escapeHtml(trackingHref(siteUrl, orderId))
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:36px;">
      <tr>
        <td align="center" style="padding:0;">
          <a href="${href}" style="text-decoration:none;color:${TEXT};display:inline-block;">
            <span style="font-family:${FONT_SERIF};font-size:22px;font-weight:400;letter-spacing:0.42em;line-height:1.4;color:${TEXT};">
              M A R E B O :)
            </span>
          </a>
        </td>
      </tr>
    </table>
  `
}

/** 3 pasos: Preparación → Enviado → Entregado. `filled` = segmentos en negro (1–3). */
function progressBarHtml(filled: 1 | 2 | 3): string {
  const labelColor = (step: 1 | 2 | 3) => (step <= filled ? TEXT : '#b0b0b0')
  const segBg = (step: 1 | 2 | 3) => (step <= filled ? TEXT : STEP_PENDING)
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0 32px;border-collapse:collapse;">
      <tr>
        <td align="center" width="33.33%" style="padding:0 4px 10px;font-family:${FONT_SANS};font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${labelColor(1)};">
          Preparación
        </td>
        <td align="center" width="33.33%" style="padding:0 4px 10px;font-family:${FONT_SANS};font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${labelColor(2)};">
          Enviado
        </td>
        <td align="center" width="33.33%" style="padding:0 4px 10px;font-family:${FONT_SANS};font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:${labelColor(3)};">
          Entregado
        </td>
      </tr>
      <tr>
        <td colspan="3" style="padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td width="33.33%" style="height:5px;background:${segBg(1)};font-size:0;line-height:0;">&nbsp;</td>
              <td width="33.33%" style="height:5px;background:${segBg(2)};font-size:0;line-height:0;">&nbsp;</td>
              <td width="33.33%" style="height:5px;background:${segBg(3)};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

function productThumbCell(imageUrl: string | null | undefined) {
  const url = imageUrl?.trim()
  if (url && /^https?:\/\//i.test(url)) {
    return `<img src="${escapeHtml(url)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:cover;border:1px solid ${BORDER};border-radius:2px;background:${TRACK_BG};" />`
  }
  return `<div style="width:56px;height:56px;border:1px solid ${BORDER};border-radius:2px;background:${TRACK_BG};"></div>`
}

/** Filas de productos: imagen y nombre enlazan a la página del pedido. */
function productRowsWithPedidoLink(
  lines: OrderConfirmationLine[],
  currency: string,
  pedidoUrl: string,
): string {
  const href = escapeHtml(pedidoUrl)
  if (lines.length === 0) {
    return `
    <tr>
      <td colspan="4" style="padding:20px 0;border-top:1px solid ${BORDER};font-family:${FONT_SANS};font-size:14px;color:${MUTED};text-align:center;">
        Tu selección aparecerá aquí en cuanto esté disponible el detalle.
      </td>
    </tr>`
  }
  return lines
    .map(
      (line) => `
    <tr>
      <td style="padding:14px 12px 14px 0;border-top:1px solid ${BORDER};vertical-align:middle;width:72px;">
        <a href="${href}" style="text-decoration:none;border:0;">${productThumbCell(line.imageUrl)}</a>
      </td>
      <td style="padding:14px 8px 14px 0;border-top:1px solid ${BORDER};vertical-align:middle;font-family:${FONT_SANS};font-size:14px;">
        <a href="${href}" style="color:${TEXT};text-decoration:none;">${escapeHtml(line.name)}</a>
      </td>
      <td style="padding:14px 8px;border-top:1px solid ${BORDER};vertical-align:middle;text-align:center;font-family:${FONT_SANS};font-size:13px;color:${MUTED};white-space:nowrap;">
        ${line.quantity}
      </td>
      <td style="padding:14px 0 14px 8px;border-top:1px solid ${BORDER};vertical-align:middle;text-align:right;font-family:${FONT_SANS};font-size:14px;color:${TEXT};white-space:nowrap;">
        ${formatMoney(line.lineTotalCents, currency)}
      </td>
    </tr>`,
    )
    .join('')
}

function totalsTable(subtotalCents: number, shippingCents: number, totalCents: number, currency: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;border-top:1px solid ${TEXT};">
      <tr>
        <td style="padding:12px 0 4px;font-family:${FONT_SANS};font-size:14px;color:${TEXT};">Subtotal</td>
        <td style="padding:12px 0 4px;text-align:right;font-family:${FONT_SANS};font-size:14px;color:${TEXT};">${formatMoney(subtotalCents, currency)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-family:${FONT_SANS};font-size:14px;color:${TEXT};">Envío</td>
        <td style="padding:4px 0;text-align:right;font-family:${FONT_SANS};font-size:14px;color:${TEXT};">${formatMoney(shippingCents, currency)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;font-family:${FONT_SERIF};font-size:16px;color:${TEXT};">Total</td>
        <td style="padding:12px 0 0;text-align:right;font-family:${FONT_SERIF};font-size:16px;color:${TEXT};">${formatMoney(totalCents, currency)}</td>
      </tr>
    </table>
  `
}

function footerHtml(siteBase: string) {
  const base = siteBase.replace(/\/$/, '').trim() || getPublicSiteBaseUrl()
  const cuenta = escapeHtml(`${base}/mi-cuenta`)
  const catalogo = escapeHtml(`${base}/catalogo`)
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:40px;border-top:1px solid ${BORDER};">
      <tr>
        <td style="padding:28px 0 0;text-align:center;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${MUTED};">
          <a href="${cuenta}" style="color:${TEXT};text-decoration:underline;">Tu cuenta</a>
          <span style="color:${BORDER};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
          <a href="${catalogo}" style="color:${TEXT};text-decoration:underline;">Tienda</a>
          <span style="color:${BORDER};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
          <a href="${INSTAGRAM_URL}" style="color:${TEXT};text-decoration:underline;">Instagram · @marebo_jewelry</a>
        </td>
      </tr>
    </table>
  `
}

function ctaButton(href: string, label: string) {
  const safe = escapeHtml(href)
  const safeLabel = escapeHtml(label)
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr>
        <td align="center" style="border-radius:2px;background:${TEXT};">
          <a href="${safe}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;padding:14px 28px;font-family:${FONT_SANS};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
  `
}

type ShellCtx = { siteUrl: string; orderId?: string | null }

function mareboShell(inner: string, ctx: ShellCtx) {
  let site = ctx.siteUrl?.trim() || getPublicSiteBaseUrl()
  if (!/^https?:\/\//i.test(site)) {
    site = getPublicSiteBaseUrl()
  }
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Marebo</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
          <tr>
            <td style="padding:0 8px;">
              ${logoHeaderHtml(site, ctx.orderId)}
              ${inner}
              ${footerHtml(site)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export type WelcomeTemplateOptions = {
  collectionUrl?: string
}

export function getWelcomeTemplate(options?: WelcomeTemplateOptions): string {
  const siteUrl = getPublicSiteBaseUrl()
  const href = options?.collectionUrl?.trim() || `${siteUrl}/catalogo`
  const inner = `
    <h1 style="margin:0 0 16px;font-family:${FONT_SERIF};font-size:26px;font-weight:400;line-height:1.35;color:${TEXT};text-align:center;">
      Bienvenida a Marebo
    </h1>
    <p style="margin:0;font-family:${FONT_SANS};font-size:15px;line-height:1.75;color:${TEXT};text-align:center;">
      Nos hace felices tenerte aquí. Tu cuenta está lista: descubre piezas y creaciones de artesanía hechas con mimo.
    </p>
    ${ctaButton(href, 'Ver selección')}
  `
  return mareboShell(inner, { siteUrl, orderId: null })
}

export type OrderConfirmationLine = {
  imageUrl?: string | null
  name: string
  quantity: number
  lineTotalCents: number
}

export type OrderConfirmationTemplateParams = {
  customerName: string
  siteUrl: string
  orderId: string
  orderRef: string
  lines: OrderConfirmationLine[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  currency: string
}

/**
 * Confirmación: preparación como primer paso (barra: solo Preparación activa en sentido “en curso”).
 */
export function getOrderConfirmationTemplate(params: OrderConfirmationTemplateParams): string {
  const { customerName, siteUrl, orderId, orderRef, lines, subtotalCents, shippingCents, totalCents, currency } =
    params
  const pedidoUrl = trackingHref(siteUrl, orderId)
  const rows = productRowsWithPedidoLink(lines, currency, pedidoUrl)

  const inner = `
    ${progressBarHtml(1)}
    <p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:14px;line-height:1.6;color:${TEXT};text-align:center;">
      Hola, ${escapeHtml(customerName)}.
    </p>
    <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:15px;line-height:1.8;color:${TEXT};text-align:center;">
      Gracias por tu confianza. Hemos comenzado a preparar tus creaciones con el máximo cuidado y mimo en nuestro taller.
    </p>
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      Tu selección
    </p>
    <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};text-align:center;">
      Ref. ${escapeHtml(orderRef)}
    </p>
    <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:12px;color:${MUTED};text-align:center;">
      Pulsa el nombre o la imagen para ver el seguimiento.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
      <tr>
        <th align="left" style="padding:0 12px 10px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;"></th>
        <th align="left" style="padding:0 8px 10px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Pieza</th>
        <th align="center" style="padding:0 8px 10px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Cant.</th>
        <th align="right" style="padding:0 0 10px 8px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Importe</th>
      </tr>
      ${rows}
    </table>
    ${totalsTable(subtotalCents, shippingCents, totalCents, currency)}
  `
  return mareboShell(inner, { siteUrl, orderId })
}

export type ShippingCarrier = 'correos' | 'packlink'

export type ShippingTemplateParams = {
  customerName: string
  siteUrl: string
  orderId: string
  orderRef: string
  carrier?: ShippingCarrier
  trackingNumber: string
  packlinkUrl: string
  lines: OrderConfirmationLine[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  currency: string
}

export function getShippingTemplate(params: ShippingTemplateParams): string {
  const {
    customerName,
    siteUrl,
    orderId,
    orderRef,
    lines,
    subtotalCents,
    shippingCents,
    totalCents,
    currency,
  } = params
  const track = params.trackingNumber.trim()
  const url = params.packlinkUrl.trim()
  const carrier: ShippingCarrier =
    params.carrier ?? (url && !track ? 'packlink' : 'correos')

  const pedidoUrl = trackingHref(siteUrl, orderId)
  const productRows = productRowsWithPedidoLink(lines, currency, pedidoUrl)

  const correosTrackUrl =
    track && /^https?:\/\//i.test(track)
      ? track
      : track
        ? `https://www.correos.es/ss/Satellite/site/aplicacion-4000003383079-busqueda_directa/busqueda_directa?language=es_ES&numero=${encodeURIComponent(track)}`
        : ''

  const companyLabel = carrier === 'packlink' ? 'Packlink' : 'Correos'

  const trackingBlock =
    carrier === 'packlink'
      ? `
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      Seguimiento · ${escapeHtml(companyLabel)}
    </p>
    <p style="margin:0 0 24px;font-family:${FONT_SERIF};font-size:15px;line-height:1.5;color:${TEXT};text-align:center;word-break:break-all;">
      ${url ? `<a href="${escapeHtml(url)}" style="color:${TEXT};text-decoration:underline;">${escapeHtml(url)}</a>` : `<span style="color:${MUTED};">—</span>`}
    </p>
    ${url ? ctaButton(url, 'Abrir seguimiento') : ''}
  `
      : `
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      Número de seguimiento · ${escapeHtml(companyLabel)}
    </p>
    <p style="margin:0 0 8px;font-family:${FONT_SERIF};font-size:32px;font-weight:400;letter-spacing:0.04em;color:${TEXT};text-align:center;line-height:1.2;word-break:break-all;">
      ${track ? escapeHtml(track) : `<span style="color:${MUTED};font-size:18px;">—</span>`}
    </p>
    ${correosTrackUrl ? ctaButton(correosTrackUrl, 'Rastrear envío') : ''}
  `

  const inner = `
    ${progressBarHtml(2)}
    <p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:14px;line-height:1.6;color:${TEXT};text-align:center;">
      Hola, ${escapeHtml(customerName)}.
    </p>
    <p style="margin:0 0 12px;font-family:${FONT_SANS};font-size:15px;line-height:1.8;color:${TEXT};text-align:center;">
      Tus piezas ya están en camino. En unos días podrás disfrutar de tu pedido.
    </p>
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      Ref. ${escapeHtml(orderRef)}
    </p>
    ${trackingBlock}
    <p style="margin:32px 0 8px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      Incluido en este envío
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-top:8px;">
      <tr>
        <th align="left" style="padding:0 12px 10px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;"></th>
        <th align="left" style="padding:0 8px 10px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Pieza</th>
        <th align="center" style="padding:0 8px 10px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Cant.</th>
        <th align="right" style="padding:0 0 10px 8px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Importe</th>
      </tr>
      ${productRows}
    </table>
    ${totalsTable(subtotalCents, shippingCents, totalCents, currency)}
  `
  return mareboShell(inner, { siteUrl, orderId })
}

export type DeliveredTemplateParams = {
  customerName: string
  siteUrl: string
  orderId: string
  orderRef: string
  lines: OrderConfirmationLine[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  currency: string
}

export function getDeliveredTemplate(params: DeliveredTemplateParams): string {
  const { customerName, siteUrl, orderId, orderRef, lines, subtotalCents, shippingCents, totalCents, currency } =
    params
  const pedidoUrl = trackingHref(siteUrl, orderId)
  const rows = productRowsWithPedidoLink(lines, currency, pedidoUrl)

  const inner = `
    ${progressBarHtml(3)}
    <p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:14px;line-height:1.6;color:${TEXT};text-align:center;">
      Hola, ${escapeHtml(customerName)}.
    </p>
    <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:15px;line-height:1.8;color:${TEXT};text-align:center;">
      Tus creaciones han llegado a su destino. Esperamos que las disfrutes tanto como nosotros hemos disfrutado creándolas para ti.
    </p>
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      Ref. ${escapeHtml(orderRef)}
    </p>
    <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:12px;color:${MUTED};text-align:center;">
      Tu selección
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
      <tr>
        <th align="left" style="padding:0 12px 10px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;"></th>
        <th align="left" style="padding:0 8px 10px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Pieza</th>
        <th align="center" style="padding:0 8px 10px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Cant.</th>
        <th align="right" style="padding:0 0 10px 8px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};font-weight:500;">Importe</th>
      </tr>
      ${rows}
    </table>
    ${totalsTable(subtotalCents, shippingCents, totalCents, currency)}
    <p style="margin:24px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:1.7;color:${MUTED};text-align:center;">
      Gracias por elegir nuestra artesanía. Te esperamos en Instagram.
    </p>
  `
  return mareboShell(inner, { siteUrl, orderId })
}

export type OrderStatusNoticeParams = {
  orderRef: string
  orderId?: string | null
  siteUrl: string
}

export function getCancelledOrderTemplate(params: OrderStatusNoticeParams): string {
  const inner = `
    <h1 style="margin:0 0 16px;font-family:${FONT_SERIF};font-size:24px;font-weight:400;line-height:1.3;color:${TEXT};text-align:center;">
      Pedido cancelado
    </h1>
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      ${escapeHtml(params.orderRef)}
    </p>
    <p style="margin:24px 0 0;font-family:${FONT_SANS};font-size:15px;line-height:1.75;color:${TEXT};text-align:center;">
      Hemos registrado la cancelación de tu pedido. Si no reconoces esta acción, responde a este correo.
    </p>
  `
  return mareboShell(inner, { siteUrl: params.siteUrl, orderId: params.orderId })
}

export function getRefundedOrderTemplate(params: OrderStatusNoticeParams): string {
  const inner = `
    <h1 style="margin:0 0 16px;font-family:${FONT_SERIF};font-size:24px;font-weight:400;line-height:1.3;color:${TEXT};text-align:center;">
      Reembolso en curso
    </h1>
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      ${escapeHtml(params.orderRef)}
    </p>
    <p style="margin:24px 0 0;font-family:${FONT_SANS};font-size:15px;line-height:1.75;color:${TEXT};text-align:center;">
      Hemos iniciado el reembolso. El plazo depende de tu entidad bancaria.
    </p>
  `
  return mareboShell(inner, { siteUrl: params.siteUrl, orderId: params.orderId })
}

/** Avisos puntuales (misma cabecera premium). */
export function getSimpleNoticeTemplate(notice: {
  eyebrow: string
  title: string
  body: string
  orderRef: string
  siteUrl: string
  orderId?: string | null
}): string {
  const inner = `
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      ${escapeHtml(notice.eyebrow)}
    </p>
    <h1 style="margin:0 0 16px;font-family:${FONT_SERIF};font-size:22px;font-weight:400;line-height:1.3;color:${TEXT};text-align:center;">
      ${escapeHtml(notice.title)}
    </h1>
    <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:15px;line-height:1.75;color:${TEXT};text-align:center;">
      ${escapeHtml(notice.body)}
    </p>
    <p style="margin:0;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};text-align:center;">
      ${escapeHtml(notice.orderRef)}
    </p>
  `
  return mareboShell(inner, { siteUrl: notice.siteUrl, orderId: notice.orderId })
}
