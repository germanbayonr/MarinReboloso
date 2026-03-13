type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendResendEmail(input: SendEmailInput) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim()
  if (!apiKey) {
    return { skipped: true }
  }

  const from = input.from ?? 'marebo.meri@gmail.com'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      reply_to: input.replyTo,
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data as any).message) ||
      (data && typeof data === 'object' && (data as any).error?.message) ||
      `Resend error (HTTP ${res.status})`
    throw new Error(String(message))
  }

  return { skipped: false, data }
}

