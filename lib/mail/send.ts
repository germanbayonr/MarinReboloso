import { getMailTransporter } from '@/lib/mail/transporter'
import { getPublicSiteBaseUrl } from '@/lib/mail/site-url'
import { getWelcomeTemplate } from '@/lib/mail/templates'

function smtpFromAddress() {
  return String(
    process.env.SMTP_USER || process.env.EMAIL_USER || '',
  ).trim()
}

export async function sendMareboMail(params: { to: string; subject: string; html: string }) {
  const transport = getMailTransporter()
  if (!transport) {
    console.error('[mail] SMTP no configurado: faltan SMTP_USER o SMTP_PASSWORD (o alias SMTP_PASS / EMAIL_USER)')
    return
  }
  const from = smtpFromAddress()
  const fromName = String(process.env.SMTP_FROM_NAME || 'Marebo').trim() || 'Marebo'
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
    const msg =
      'SMTP no configurado: revisa SMTP_USER y SMTP_PASSWORD en .env.local (reinicia next dev) o usa SMTP_PASS / EMAIL_USER'
    console.error('[mail]', msg)
    return { ok: false, error: msg }
  }
  const from = smtpFromAddress()
  const fromName = String(process.env.SMTP_FROM_NAME || 'Marebo').trim() || 'Marebo'
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
