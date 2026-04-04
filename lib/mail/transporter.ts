import nodemailer from 'nodemailer'

/** Cliente SMTP Gmail (o compatible) usando credenciales del .env.local */
export function getMailTransporter() {
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASSWORD?.trim()
  if (!user || !pass) return null

  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT?.trim() || '465')

  return nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
  })
}
