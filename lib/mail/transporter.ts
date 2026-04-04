import nodemailer from 'nodemailer'

/**
 * Credenciales efectivas para Nodemailer (lectura en cada llamada).
 * Tras editar `.env.local`, reinicia `next dev` para que Next cargue los cambios.
 */
function resolveSmtpAuth(): { user: string; pass: string } {
  console.log('Cargando SMTP User:', process.env.SMTP_USER ? 'OK' : 'FALTA')
  console.log('Cargando SMTP Password:', process.env.SMTP_PASSWORD ? 'OK' : 'FALTA')

  const user = String(
    process.env.SMTP_USER || process.env.EMAIL_USER || '',
  ).trim()

  const pass = String(
    process.env.SMTP_PASSWORD ||
      process.env.SMTP_PASS ||
      process.env.EMAIL_PASSWORD ||
      process.env.GMAIL_APP_PASSWORD ||
      '',
  ).trim()

  return { user, pass }
}

/** Cliente SMTP (Gmail u otro). auth: user/pass desde entorno del servidor. */
export function getMailTransporter() {
  const { user, pass } = resolveSmtpAuth()

  if (!user || !pass) {
    return null
  }

  const host = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim() || 'smtp.gmail.com'
  const port = Number(String(process.env.SMTP_PORT || '465').trim()) || 465

  return nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: {
      user: String(process.env.SMTP_USER || user).trim(),
      pass: String(process.env.SMTP_PASSWORD || process.env.SMTP_PASS || pass).trim(),
    },
  })
}
