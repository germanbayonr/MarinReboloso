import { NextResponse } from 'next/server'
import { jsonError, jsonOk, requireAdminApiContext } from '@/lib/admin/require-admin-api'
import { sendMareboMailResult } from '@/lib/mail/send'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** POST { "to": "email@..." } — prueba SMTP en el entorno actual (local o Vercel). */
export async function POST(req: Request) {
  const auth = await requireAdminApiContext()
  if (!auth.ok) return auth.response

  let to = auth.email
  try {
    const body = await req.json()
    if (body && typeof body === 'object' && typeof (body as { to?: unknown }).to === 'string') {
      const candidate = String((body as { to: string }).to).trim()
      if (candidate.includes('@')) to = candidate
    }
  } catch {
    /* body opcional */
  }

  const result = await sendMareboMailResult({
    to,
    subject: '[Marebo] Prueba SMTP desde panel',
    html: '<p>Si ves este correo, SMTP funciona en este entorno (local o producción).</p>',
  })

  if (!result.ok) return jsonError(result.error, 503)
  return jsonOk({ sentTo: to })
}
