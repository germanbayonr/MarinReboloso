import type Stripe from 'stripe'
import { unstable_cache } from 'next/cache'
import { stripe } from '@/lib/stripe'

export type StripePriceMap = Record<string, number>

async function fetchStripePrices(): Promise<StripePriceMap> {
  if (!stripe) return {}

  const res = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
    limit: 100,
  })

  const map: StripePriceMap = {}

  for (const product of res.data) {
    const price = product.default_price as Stripe.Price | null
    const unitAmount = price?.unit_amount
    if (typeof unitAmount !== 'number') continue
    if (price?.currency && price.currency !== 'eur') continue
    map[product.name] = unitAmount / 100
  }

  return map
}

export const fetchStripePricesCached = unstable_cache(fetchStripePrices, ['stripe-prices'], {
  revalidate: 3600,
})
