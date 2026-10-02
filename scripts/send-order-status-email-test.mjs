/**
 * Envía plantillas de cambio de estado a un email de prueba (SMTP desde .env.local).
 * Uso: node scripts/send-order-status-email-test.mjs erwuasa@gmail.com
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function loadEnv() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) throw new Error('Falta .env.local')
  const out = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    out[t.slice(0, i)] = t.slice(i + 1)
  }
  return out
}

async function fetchSampleOrder(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(`${url}/rest/v1/orders?select=*&order=created_at.desc&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`orders fetch ${res.status}`)
  const rows = await res.json()
  if (!rows[0]) throw new Error('No hay pedidos en BD para montar la plantilla')
  return rows[0]
}

async function main() {
  const to = process.argv[2]?.trim() || 'erwuasa@gmail.com'
  const env = loadEnv()
  const user = env.SMTP_USER?.trim()
  const pass = env.SMTP_PASSWORD?.trim()
  if (!user || !pass) throw new Error('SMTP_USER / SMTP_PASSWORD faltan en .env.local')

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: Number(env.SMTP_PORT || 465),
    secure: true,
    auth: { user, pass },
  })

  await transport.verify()
  console.log('SMTP verify OK')

  const order = await fetchSampleOrder(env)
  order.customer_email = to
  order.customer_name = order.customer_name || 'Cliente prueba Marebo'

  process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
  process.env.NEXT_PUBLIC_SITE_URL = env.NEXT_PUBLIC_SITE_URL || 'https://marebo.es'
  process.env.SMTP_USER = user
  process.env.SMTP_PASSWORD = pass
  process.env.SMTP_HOST = env.SMTP_HOST
  process.env.SMTP_PORT = env.SMTP_PORT
  process.env.SMTP_FROM_NAME = env.SMTP_FROM_NAME

  const { notifyCustomerOrderStatusChange } = await import('../lib/mail/order-status-mail.ts')

  const statuses = [
    ['pendiente', 'confirmación / en preparación'],
    ['enviado', 'en camino (requiere tracking en BD)'],
    ['entregado', 'entregado'],
    ['cancelado', 'cancelado'],
    ['reembolsado', 'reembolso'],
  ]

  if (statuses.find(([s]) => s === 'enviado')) {
    order.tracking_number = order.tracking_number || 'PK123456789ES'
    order.shipping_carrier = order.shipping_carrier || 'correos'
  }

  const results = []
  for (const [status, label] of statuses) {
    if (status === 'preparando') continue
    const r = await notifyCustomerOrderStatusChange(order, status)
    results.push({ status, label, ...r })
    console.log(status, r)
    await new Promise((r) => setTimeout(r, 1500))
  }

  const failed = results.filter((r) => r.ok === false)
  if (failed.length) {
    console.error('Algunos envíos fallaron:', failed)
    process.exit(1)
  }
  console.log(`Listo: revisa la bandeja de ${to} (y spam). Enviados ${results.filter((r) => r.ok && !r.skipped).length} correos.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
