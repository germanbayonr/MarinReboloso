import { getMailTransporter } from '@/lib/mail/transporter'
import { getPublicSiteBaseUrl } from '@/lib/mail/site-url'
import { getWelcomeTemplate } from '@/lib/mail/templates'

export async function sendMareboMail(params: { to: string; subject: string; html: string }) {
  const transport = getMailTransporter()
  if (!transport) {
    console.error('[mail] SMTP no configurado: faltan SMTP_USER o SMTP_PASSWORD')
    return
  }
  const from = process.env.SMTP_USER?.trim()
  const fromName = process.env.SMTP_FROM_NAME?.trim() || 'Marebo'
  if (!from) {
    console.error('[mail] SMTP_USER vacío')
    return
  }
  try {
    await transport.sendMail({
      from: `"${fromName}" <${from}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
  } catch (e) {
    console.error('[mail] Error enviando correo:', e)
  }
}

/** Igual que sendMareboMail pero devuelve éxito/error (p. ej. simulación de compra en admin). */
export async function sendMareboMailResult(params: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const transport = getMailTransporter()
  if (!transport) {
    const msg = 'SMTP no configurado: faltan SMTP_USER o SMTP_PASSWORD'
    console.error('[mail]', msg)
    return { ok: false, error: msg }
  }
  const from = process.env.SMTP_USER?.trim()
  const fromName = process.env.SMTP_FROM_NAME?.trim() || 'Marebo'
  if (!from) {
    console.error('[mail] SMTP_USER vacío')
    return { ok: false, error: 'SMTP_USER vacío' }
  }
  try {
    await transport.sendMail({
      from: `"${fromName}" <${from}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    return { ok: true }
  } catch (e: unknown) {
    console.error('[mail] Error enviando correo:', e)
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, error: message }
  }
}

function defaultCollectionUrl() {
  return `${getPublicSiteBaseUrl()}/catalogo`
}

export async function sendWelcomeEmail(to: string) {
  await sendMareboMail({
    to,
    subject: 'Bienvenida a Marebo',
    html: getWelcomeTemplate({ collectionUrl: defaultCollectionUrl() }),
  })
}
