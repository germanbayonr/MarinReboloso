import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkoutSchema } from '@/lib/validation/checkout'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const cartItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  image: z.string().min(1),
  quantity: z.number().int().positive(),
  variant: z.string().optional(),
})

const requestSchema = z.object({
  customerData: checkoutSchema,
  cartItems: z.array(cartItemSchema).min(1),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { customerData, cartItems } = requestSchema.parse(json)

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    if (!stripeSecretKey || !siteUrl) {
      return NextResponse.json({ success: false, error: 'Missing server configuration' }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey)
    let supabase: ReturnType<typeof createSupabaseServerClient>
    try {
      supabase = createSupabaseServerClient()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Supabase server client not configured'
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }

    const { data: customerRow, error: customerError } = await supabase
      .from('customers')
      .insert([
        {
          email: customerData.email,
          phone: customerData.phone,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          address1: customerData.address1,
          address2: customerData.address2 || null,
          city: customerData.city,
          province: customerData.province,
          postal_code: customerData.postalCode,
          country: customerData.country,
        },
      ])
      .select('id')
      .single()

    if (customerError) {
      return NextResponse.json({ success: false, error: customerError.message }, { status: 500 })
    }

    const orderSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: customerRow.id,
          status: 'pending',
          subtotal: orderSubtotal,
          total: orderSubtotal,
          currency: 'EUR',
          email: customerData.email,
          phone: customerData.phone,
          shipping_first_name: customerData.firstName,
          shipping_last_name: customerData.lastName,
          shipping_address1: customerData.address1,
          shipping_address2: customerData.address2 || null,
          shipping_city: customerData.city,
          shipping_province: customerData.province,
          shipping_postal_code: customerData.postalCode,
          shipping_country: customerData.country,
        },
      ])
      .select('id')
      .single()

    if (orderError) {
      return NextResponse.json({ success: false, error: orderError.message }, { status: 500 })
    }

    const orderId = orderRow.id

    const orderItemsPayload = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.id,
      product_name: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      variant: item.variant || null,
      image: item.image,
      line_total: item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)

    if (itemsError) {
      return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 })
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.price * 100),
        product_data: {
          name: item.name,
          images: [item.image],
        },
      },
    }))

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${siteUrl}/checkout/success`,
      cancel_url: `${siteUrl}/checkout`,
      customer_email: customerData.email,
      line_items,
      metadata: {
        supabaseOrderId: String(orderId),
      },
    })

    if (!session.url) {
      return NextResponse.json({ success: false, error: 'Failed to create Stripe session' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: session.url })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
