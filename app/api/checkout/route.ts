import { NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { validatePromoCodePublic } from '@/lib/promotions'
import { findStripePromotionCodeId } from '@/lib/stripe-promotions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const cartItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  stripe_price_id: z.string().min(1).optional(),
})

const requestSchema = z.object({
  cartItems: z.array(cartItemSchema).min(1),
  promoCode: z.string().nullable().optional(),
  customer: z
    .object({
      email: z.string().email().optional(),
    })
    .passthrough()
    .optional(),
  customerDetails: z
    .object({
      email: z.string().email().optional(),
    })
    .passthrough()
    .optional(),
  customerData: z
    .object({
      email: z.string().email().optional(),
    })
    .passthrough()
    .optional(),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { customer, customerData, customerDetails, cartItems, promoCode } = requestSchema.parse(json)

    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY ||
      process.env.STRIPE_SECRET ||
      process.env.NEXT_STRIPE_SECRET_KEY ||
      ''
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: { message: 'Missing STRIPE_SECRET_KEY' } },
        { status: 500 },
      )
    }

    const stripe = new Stripe(stripeSecretKey)

    const supabase = createSupabaseServerClient()
    const productIds = Array.from(new Set(cartItems.map((i) => i.id)))
    const { data: rows, error: dbError } = await supabase
      .from('products')
      .select('id,price,stripe_product_id,stripe_price_id')
      .eq('is_active', true)
      .eq('in_stock', true)
      .in('id', productIds)
      .limit(5000)

    if (dbError) {
      return NextResponse.json(
        { error: { message: 'Supabase error fetching stripe_price_id' } },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const byId = new Map<string, string | null>()
    const productRows = (rows ?? []) as Array<{
      id: string
      price: number | string
      stripe_product_id: string | null
      stripe_price_id: string | null
    }>

    for (const row of productRows) {
      const productId = String(row.id)
      const stripePriceId = row.stripe_price_id ? String(row.stripe_price_id) : ''
      const stripeProductId = row.stripe_product_id ? String(row.stripe_product_id) : ''
      const expectedUnitAmount = Math.round(Number(row.price) * 100)

      if (!stripePriceId || !Number.isFinite(expectedUnitAmount) || expectedUnitAmount <= 0) {
        byId.set(productId, stripePriceId || null)
        continue
      }

      try {
        const currentStripePrice = await stripe.prices.retrieve(stripePriceId)
        if (currentStripePrice.active && currentStripePrice.currency === 'eur' && currentStripePrice.unit_amount === expectedUnitAmount) {
          byId.set(productId, stripePriceId)
          continue
        }

        if (!stripeProductId) {
          byId.set(productId, stripePriceId)
          continue
        }

        const freshStripePrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: expectedUnitAmount,
          currency: 'eur',
        })

        const { error: updateStripePriceError } = await supabase
          .from('products')
          .update({ stripe_price_id: freshStripePrice.id })
          .eq('id', productId)

        if (updateStripePriceError) {
          byId.set(productId, stripePriceId)
          continue
        }

        byId.set(productId, freshStripePrice.id)
      } catch {
        byId.set(productId, stripePriceId)
      }
    }

    const missingIds = productIds.filter((id) => !byId.has(id))
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: { message: 'Producto no encontrado en Supabase', missingIds } },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const missingStripeIds = productIds.filter((id) => !byId.get(id))
    if (missingStripeIds.length > 0) {
      return NextResponse.json(
        { error: { message: 'Producto sin stripe_price_id en Supabase', missingIds: missingStripeIds } },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => ({
      quantity: item.quantity,
      price: byId.get(item.id) as string,
    }))

    const forwardedHost = req.headers.get('x-forwarded-host')
    const forwardedProto = req.headers.get('x-forwarded-proto')
    const origin = forwardedHost
      ? `${forwardedProto ?? 'https'}://${forwardedHost}`
      : req.headers.get('origin') || new URL(req.url).origin

    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
    if (promoCode) {
      const promo = await validatePromoCodePublic(promoCode)
      if (!promo.isValid || !promo.discountPercentage || !promo.code) {
        return NextResponse.json(
          { error: { message: 'Código promocional no válido.' } },
          { status: 400, headers: { 'Cache-Control': 'no-store' } },
        )
      }
      const stripePromotionCodeId = await findStripePromotionCodeId({
        stripe,
        code: promo.code,
        discountPercentage: promo.discountPercentage,
        isActive: true,
      })
      if (!stripePromotionCodeId) {
        return NextResponse.json(
          {
            error: {
              message:
                'El código existe, pero no está sincronizado en Stripe. Actívalo de nuevo desde el panel de promociones.',
            },
          },
          { status: 400, headers: { 'Cache-Control': 'no-store' } },
        )
      }
      discounts = [{ promotion_code: stripePromotionCodeId }]
    }

    const metadata = cartItems.reduce(
      (acc, item, idx) => {
        if (item.id) acc[`supabase_product_${idx}`] = item.id
        return acc
      },
      {} as Record<string, string>,
    )
    if (promoCode) metadata.promo_code = String(promoCode).trim().toUpperCase()

    const hasDiscounts = Boolean(discounts?.length)
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: customer?.email ?? customerDetails?.email ?? customerData?.email,
      shipping_address_collection: { allowed_countries: ['ES'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 500, currency: 'eur' },
            display_name: 'Envío estándar',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 4 },
            },
          },
        },
      ],
      line_items,
      metadata,
      ...(hasDiscounts ? { discounts } : { allow_promotion_codes: true }),
    }
    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      return NextResponse.json({ error: { message: 'Failed to create Stripe session' } }, { status: 500 })
    }

    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: { message: 'Invalid payload' } }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: { message } }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
