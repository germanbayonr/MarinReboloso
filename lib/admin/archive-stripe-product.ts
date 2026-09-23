import Stripe from 'stripe'

function isStripeResourceMissing(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const stripeErr = error as Stripe.errors.StripeError
  if (stripeErr.code === 'resource_missing') return true
  const msg = error.message.toLowerCase()
  return msg.includes('no such product') || msg.includes('no such price')
}

function isDefaultPriceArchiveError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return msg.includes('default price') || msg.includes('default_price')
}

/** Desactiva precios activos (excepto el default si Stripe lo bloquea) y archiva el producto. */
export async function archiveStripeProduct(
  stripe: Stripe,
  stripeProductId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = String(stripeProductId ?? '').trim()
  if (!id) return { ok: true }

  try {
    const product = await stripe.products.retrieve(id)
    const defaultPriceId =
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price && typeof product.default_price === 'object'
          ? product.default_price.id
          : null

    let startingAfter: string | undefined
    for (;;) {
      const page = await stripe.prices.list({
        product: id,
        active: true,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      for (const price of page.data) {
        if (defaultPriceId && price.id === defaultPriceId) continue
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

    if (defaultPriceId) {
      try {
        await stripe.prices.update(defaultPriceId, { active: false })
      } catch (priceError) {
        if (!isStripeResourceMissing(priceError) && !isDefaultPriceArchiveError(priceError)) {
          throw priceError
        }
      }
    }

    return { ok: true }
  } catch (error) {
    if (isStripeResourceMissing(error)) return { ok: true }
    const msg = error instanceof Error ? error.message : 'Error desconocido en Stripe'
    return { ok: false, error: msg }
  }
}
