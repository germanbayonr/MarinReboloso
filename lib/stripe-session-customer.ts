import type Stripe from 'stripe'
import { normalizeCustomerPhone } from '@/lib/normalize-customer-phone'

export function customerPhoneFromStripeSession(session: Stripe.Checkout.Session): string | null {
  const fromMeta = session.metadata?.customer_phone
  const normalizedMeta = normalizeCustomerPhone(fromMeta)
  if (normalizedMeta) return normalizedMeta

  const fromDetails = session.customer_details?.phone
  return normalizeCustomerPhone(fromDetails)
}

export function checkoutNameFromStripeSession(session: Stripe.Checkout.Session): string | null {
  const metaFirst = session.metadata?.customer_first_name?.trim()
  const metaLast = session.metadata?.customer_last_name?.trim()
  if (metaFirst || metaLast) {
    return [metaFirst, metaLast].filter(Boolean).join(' ').trim() || null
  }
  return session.customer_details?.name?.trim() || null
}
