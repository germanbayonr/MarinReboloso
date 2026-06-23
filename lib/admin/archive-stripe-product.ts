import Stripe from 'stripe'

function isStripeResourceMissing(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const stripeErr = error as Stripe.errors.StripeError
  if (stripeErr.code === 'resource_missing') return true
  const msg = error.message.toLowerCase()
  return msg.includes('no such product') || msg.includes('no such price')
}

/** Desactiva precios activos y archiva el producto en Stripe (no borra historial de pedidos). */
export async function archiveStripeProduct(
  stripe: Stripe,
  stripeProductId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = String(stripeProductId ?? '').trim()
  if (!id) return { ok: true }

  try {
    let startingAfter: string | undefined
    for (;;) {
      const page = await stripe.prices.list({
        product: id,
        active: true,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      for (const price of page.data) {
        try {
          await stripe.prices.update(price.id, { active: false })
        } catch (priceError) {
          if (!isStripeResourceMissing(priceError)) throw priceError
        }
      }
      if (!page.has_more || page.data.length === 0) break
      startingAfter = page.data[page.data.length - 1]?.id
      if (!startingAfter) break
    }

    await stripe.products.update(id, { active: false })
    return { ok: true }
  } catch (error) {
    if (isStripeResourceMissing(error)) return { ok: true }
    const msg = error instanceof Error ? error.message : 'Error desconocido en Stripe'
    return { ok: false, error: msg }
  }
}
