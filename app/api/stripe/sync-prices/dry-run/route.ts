import { NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { readFile } from 'fs/promises'
import path from 'path'
import type Stripe from 'stripe'

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

const rowSchema = z.object({
  name: z.string(),
  price: z.number(),
})

type ReportRow = {
  webName: string
  stripeName: string | null
  webPrice: number
  stripePrice: number | null
  status: 'Match exacto' | 'Match parcial' | 'No encontrado'
}

async function resolveStripeEurPrice(
  stripeClient: Stripe,
  product: Stripe.Product,
) {
  const defaultPrice = product.default_price
  if (defaultPrice && typeof defaultPrice !== 'string') {
    if (defaultPrice.currency === 'eur' && typeof defaultPrice.unit_amount === 'number') {
      return defaultPrice.unit_amount / 100
    }
  }

  const prices = await stripeClient.prices.list({ product: product.id, active: true, limit: 25 })
  const eur = prices.data.find((p) => p.currency === 'eur' && typeof p.unit_amount === 'number')
  if (!eur || typeof eur.unit_amount !== 'number') return null
  return eur.unit_amount / 100
}

async function loadWebProductsFromSeedFile() {
  const filePath = path.join(process.cwd(), 'lib', 'products-context.tsx')
  const src = await readFile(filePath, 'utf8')

  const start = src.indexOf('const INITIAL_RAW_PRODUCTS')
  if (start < 0) return []
  const end = src.indexOf('const COLOR_SUFFIXES', start)
  const segment = end > start ? src.slice(start, end) : src.slice(start)

  const out: { name: string; price: number }[] = []
  const re = /name:\s*'([^']+)'\s*,[\s\S]*?price:\s*(\d+(?:\.\d+)?)\s*,/g
  let match: RegExpExecArray | null
  while ((match = re.exec(segment))) {
    const name = match[1]
    const price = Number(match[2])
    if (!name || !Number.isFinite(price)) continue
    out.push({ name, price })
  }
  return out
}

export async function GET() {
  if (!stripe) {
    return NextResponse.json({ success: false, error: 'Stripe not configured' }, { status: 500 })
  }
  const stripeClient = stripe

  let supabase: ReturnType<typeof createSupabaseServerClient>
  try {
    supabase = createSupabaseServerClient()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Supabase server client not configured'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  const { data: dbProducts, error: dbError } = await supabase.from('products').select('name,price').eq('status', 'published')

  const webProducts = dbError
    ? z.array(rowSchema).parse(await loadWebProductsFromSeedFile())
    : z.array(rowSchema).parse(dbProducts ?? [])

  if (webProducts.length === 0) {
    return NextResponse.json({ success: false, error: 'No web products found to compare' }, { status: 500 })
  }

  const stripeRes = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
    limit: 100,
  })

  const stripeExact = new Map<string, { name: string; price: number }>()
  const stripeNormalized = new Map<string, { name: string; price: number }>()

  for (const p of stripeRes.data) {
    const price = await resolveStripeEurPrice(stripeClient, p)
    if (typeof price !== 'number') continue
    stripeExact.set(p.name, { name: p.name, price })
    stripeNormalized.set(normalizeName(p.name), { name: p.name, price })
  }

  const report: ReportRow[] = webProducts.map((web) => {
    const exact = stripeExact.get(web.name)
    if (exact) {
      return {
        webName: web.name,
        stripeName: exact.name,
        webPrice: web.price,
        stripePrice: exact.price,
        status: 'Match exacto',
      }
    }

    const partial = stripeNormalized.get(normalizeName(web.name))
    if (partial) {
      return {
        webName: web.name,
        stripeName: partial.name,
        webPrice: web.price,
        stripePrice: partial.price,
        status: 'Match parcial',
      }
    }

    return {
      webName: web.name,
      stripeName: null,
      webPrice: web.price,
      stripePrice: null,
      status: 'No encontrado',
    }
  })

  const summary = report.reduce(
    (acc, row) => {
      acc[row.status] += 1
      return acc
    },
    { 'Match exacto': 0, 'Match parcial': 0, 'No encontrado': 0 } as Record<ReportRow['status'], number>,
  )

  console.table(
    report.map((r) => ({
      webName: r.webName,
      stripeName: r.stripeName ?? '',
      webPrice: r.webPrice,
      stripePrice: r.stripePrice ?? '',
      status: r.status,
    })),
  )

  return NextResponse.json({ success: true, summary, report })
}
