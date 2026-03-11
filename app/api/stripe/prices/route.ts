import { NextResponse } from 'next/server'
import { fetchStripePricesCached } from '@/lib/stripe-prices'

export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ prices: {}, enabled: false })
  }

  const prices = await fetchStripePricesCached()
  return NextResponse.json({ prices, enabled: true })
}
