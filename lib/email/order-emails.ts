import { sendResendEmail } from '@/lib/email/resend'

export type OrderEmailItem = {
  name: string
  quantity: number
  unitAmount: number | null
  currency: string | null
}

export type OrderEmailData = {
  orderReference: string
  customerEmail: string
  items: OrderEmailItem[]
  totalAmount: number | null
  currency: string | null
}

function formatMoney(amount: number | null, currency: string | null) {
  if (amount == null) return '—'
  const curr = (currency ?? 'eur').toUpperCase()
  const value = amount / 100
  if (curr === 'EUR') return `${value.toFixed(2)}€`
  return `${value.toFixed(2)} ${curr}`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function buildCustomerEmailHtml(order: OrderEmailData) {
  const itemsHtml =
    order.items.length > 0
      ? order.items
          .map((i) => {
            const lineTotal = i.unitAmount != null ? i.unitAmount * i.quantity : null
            return `
              <tr>
                <td style="padding:14px 0;border-top:1px solid #EEE; font-size:14px; color:#111; letter-spacing:0.02em;">
                  ${escapeHtml(i.name)} <span style="color:#666;">×${i.quantity}</span>
                </td>
                <td style="padding:14px 0;border-top:1px solid #EEE; text-align:right; font-size:14px; color:#111;">
                  ${formatMoney(lineTotal, i.currency)}
                </td>
              </tr>
            `
          })
          .join('')
      : `
          <tr>
            <td style="padding:14px 0;border-top:1px solid #EEE; font-size:14px; color:#666;">
              Detalle de productos pendiente de confirmación.
            </td>
            <td style="padding:14px 0;border-top:1px solid #EEE; text-align:right; font-size:14px; color:#666;">—</td>
          </tr>
        `

  return `
  <div style="background:#FAFAF7; padding:28px 0;">
    <div style="max-width:640px; margin:0 auto; background:#fff; border:1px solid #EEE; padding:28px;">
      <div style="font-size:11px; letter-spacing:0.35em; text-transform:uppercase; color:#777;">
        Marebo
      </div>
      <h1 style="margin:14px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size:28px; letter-spacing:0.02em; color:#111;">
        Gracias por tu pedido
      </h1>
      <p style="margin:12px 0 0; font-size:14px; color:#444; line-height:1.7;">
        Hemos recibido tu pedido. Te escribiremos de nuevo cuando esté en preparación para envío.
      </p>
      <p style="margin:14px 0 0; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#777;">
        Referencia <span style="color:#111;">${escapeHtml(order.orderReference)}</span>
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px; border-collapse:collapse;">
        ${itemsHtml}
        <tr>
          <td style="padding:16px 0;border-top:1px solid #EEE; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#777;">
            Total
          </td>
          <td style="padding:16px 0;border-top:1px solid #EEE; text-align:right; font-size:16px; color:#111; letter-spacing:0.02em;">
            ${formatMoney(order.totalAmount, order.currency)}
          </td>
        </tr>
      </table>

      <div style="margin-top:26px; font-size:12px; color:#666; line-height:1.7;">
        Si necesitas ayuda, responde a este correo.
      </div>
    </div>
  </div>
  `
}

function buildInternalEmailHtml(order: OrderEmailData) {
  const itemsHtml = order.items
    .map((i) => {
      return `<li style="margin:6px 0; color:#111; font-size:14px;">${escapeHtml(i.name)} ×${i.quantity}</li>`
    })
    .join('')

  return `
    <div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; color:#111;">
      <h2 style="margin:0 0 10px; font-size:18px;">Nuevo Pedido Recibido</h2>
      <div style="font-size:13px; color:#444; line-height:1.7;">
        <div><strong>Referencia:</strong> ${escapeHtml(order.orderReference)}</div>
        <div><strong>Email cliente:</strong> ${escapeHtml(order.customerEmail)}</div>
        <div><strong>Total:</strong> ${formatMoney(order.totalAmount, order.currency)}</div>
      </div>
      <div style="margin-top:14px; font-size:13px; color:#444;">
        <strong>Productos</strong>
        <ul style="margin:8px 0 0; padding-left:18px;">
          ${itemsHtml || '<li style="margin:6px 0; color:#666;">Sin detalle de items.</li>'}
        </ul>
      </div>
    </div>
  `
}

export async function sendOrderConfirmation(order: OrderEmailData) {
  return sendResendEmail({
    to: order.customerEmail,
    subject: `Gracias por tu pedido · ${order.orderReference}`,
    html: buildCustomerEmailHtml(order),
    from: 'marebo.meri@gmail.com',
    replyTo: 'marebo.meri@gmail.com',
  })
}

export async function sendNewOrderNotification(order: OrderEmailData) {
  const to = (process.env.ORDERS_NOTIFICATION_EMAIL || 'marebo.meri@gmail.com').trim()
  return sendResendEmail({
    to,
    subject: `Nuevo Pedido Recibido · ${order.orderReference}`,
    html: buildInternalEmailHtml(order),
    from: 'marebo.meri@gmail.com',
    replyTo: order.customerEmail,
  })
}

