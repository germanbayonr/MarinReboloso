'use server'

import { sendWelcomeEmail } from '@/lib/mail/send'

/** Correo de bienvenida (no bloquea si falla el SMTP). */
export async function sendWelcomeEmailAction(email: string) {
  try {
    await sendWelcomeEmail(email.trim())
  } catch (e) {
    console.error('[mail] sendWelcomeEmailAction:', e)
  }
}
