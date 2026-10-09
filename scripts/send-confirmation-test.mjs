import fs from 'fs'
import nodemailer from 'nodemailer'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    }),
)

const to = process.argv[2]?.trim() || 'erwuasa@gmail.com'
const orderId = process.argv[3]?.trim() || 'b5c367ff-460e-49c9-b978-1021448c0210'

async function main() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(`${url}/rest/v1/orders?id=eq.${orderId}&select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const [order] = await res.json()
  if (!order) throw new Error('Pedido no encontrado')

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(env.SMTP_PORT || 465),
    secure: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  })
  await transport.verify()

  const ref = String(order.id).replace(/-/g, '').slice(0, 10).toUpperCase()
  const lines = Array.isArray(order.items_json) ? order.items_json : []
  const list = lines
    .map((i) => `<li>${String(i.name ?? 'Pieza')} ×${Number(i.quantity ?? 1)}</li>`)
    .join('')

  await transport.sendMail({
    from: `"${env.SMTP_FROM_NAME || 'Marebo'}" <${env.SMTP_USER}>`,
    to,
    subject: `[Marebo] Confirmación pedido ${ref} (prueba)`,
    html: `<p>Hola ${order.customer_name || 'Cliente'},</p><p>Prueba de confirmación de compra (pedido real ${ref}).</p><ul>${list || `<li>${order.line_summary || 'Pedido'}</li>`}</ul>`,
  })
  console.log('Sent confirmation-style test to', to)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
