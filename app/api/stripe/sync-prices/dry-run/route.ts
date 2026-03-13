import { NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type Stripe from 'stripe'

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function isMissingProductsTable(message: string) {
  return message.includes("Could not find the table 'public.products'") || message.includes('schema cache')
}

function setupSql() {
  return [
    "alter table public.products add column if not exists stripe_product_id text;",
    "alter table public.products add column if not exists stripe_price_id text;",
    "create index if not exists products_stripe_product_id_idx on public.products (stripe_product_id);",
    "create index if not exists products_stripe_price_id_idx on public.products (stripe_price_id);",
  ].join('\n')
}

const supabaseProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  description: z.string().nullable().optional(),
  stripe_product_id: z.string().nullable().optional(),
  stripe_price_id: z.string().nullable().optional(),
})

const postBodySchema = z.object({
  dryRun: z.boolean().optional(),
  onlyMissingIds: z.boolean().optional(),
})

type SupabaseProduct = z.infer<typeof supabaseProductSchema>

type PlanRow = {
  supabaseId: string
  supabaseName: string
  supabasePrice: number
  stripeProductId: string | null
  stripePriceId: string | null
  stripeName: string | null
  stripePrice: number | null
  action:
    | 'Mantener'
    | 'Actualizar IDs (match por nombre)'
    | 'Crear en Stripe + guardar IDs'
    | 'Crear precio EUR + guardar price_id'
    | 'Ambiguo (revisión manual)'
    | 'Stripe ID inválido (revisión manual)'
  match: 'Por ID' | 'Por nombre normalizado' | 'Ninguno' | 'Ambiguo' | 'ID inválido'
}

function euroToUnitAmount(price: number) {
  return Math.round(price * 100)
}

async function getSupabaseStripeIdStats(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const totalRes = await supabase.from('products').select('id', { count: 'exact', head: true })
  const withProductIdRes = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('stripe_product_id', 'is', null)
  const withPriceIdRes = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('stripe_price_id', 'is', null)

  return {
    total: totalRes.count ?? null,
    withStripeProductId: withProductIdRes.count ?? null,
    withStripePriceId: withPriceIdRes.count ?? null,
  }
}

async function listAllStripeProducts(stripeClient: Stripe) {
  const out: Stripe.Product[] = []
  let startingAfter: string | undefined

  while (true) {
    const res = await stripeClient.products.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.default_price'],
    })
    out.push(...res.data)
    if (!res.has_more) break
    startingAfter = res.data[res.data.length - 1]?.id
    if (!startingAfter) break
  }

  return out
}

async function resolveStripeEurPrice(
  stripeClient: Stripe,
  product: Stripe.Product,
  preferPriceId?: string | null,
) {
  const defaultPrice = product.default_price
  if (defaultPrice && typeof defaultPrice !== 'string') {
    if (defaultPrice.currency === 'eur' && typeof defaultPrice.unit_amount === 'number') {
      return { priceId: defaultPrice.id, price: defaultPrice.unit_amount / 100 }
    }
  }

  if (preferPriceId) {
    try {
      const p = await stripeClient.prices.retrieve(preferPriceId)
      if (p.active && p.currency === 'eur' && typeof p.unit_amount === 'number') {
        return { priceId: p.id, price: p.unit_amount / 100 }
      }
    } catch {}
  }

  const prices = await stripeClient.prices.list({ product: product.id, active: true, limit: 25 })
  const eur = prices.data.find((p) => p.currency === 'eur' && typeof p.unit_amount === 'number')
  if (!eur || typeof eur.unit_amount !== 'number') return null
  return { priceId: eur.id, price: eur.unit_amount / 100 }
}

async function buildPlan({
  stripeClient,
  supabaseProducts,
  onlyMissingIds,
}: {
  stripeClient: Stripe
  supabaseProducts: SupabaseProduct[]
  onlyMissingIds: boolean
}) {
  const stripeProducts = await listAllStripeProducts(stripeClient)

  const stripeById = new Map<string, Stripe.Product>()
  const stripeByNormalizedName = new Map<string, Stripe.Product[]>()

  for (const p of stripeProducts) {
    stripeById.set(p.id, p)
    const key = normalizeName(p.name)
    const list = stripeByNormalizedName.get(key)
    if (list) list.push(p)
    else stripeByNormalizedName.set(key, [p])
  }

  const plan: PlanRow[] = []

  for (const sp of supabaseProducts) {
    if (onlyMissingIds && sp.stripe_product_id) continue

    const normalized = normalizeName(sp.name)
    const byId = sp.stripe_product_id ? stripeById.get(sp.stripe_product_id) : undefined

    if (sp.stripe_product_id && !byId) {
      plan.push({
        supabaseId: sp.id,
        supabaseName: sp.name,
        supabasePrice: sp.price,
        stripeProductId: sp.stripe_product_id ?? null,
        stripePriceId: sp.stripe_price_id ?? null,
        stripeName: null,
        stripePrice: null,
        action: 'Stripe ID inválido (revisión manual)',
        match: 'ID inválido',
      })
      continue
    }

    if (byId) {
      const eur = await resolveStripeEurPrice(stripeClient, byId, sp.stripe_price_id)
      if (!eur) {
        plan.push({
          supabaseId: sp.id,
          supabaseName: sp.name,
          supabasePrice: sp.price,
          stripeProductId: byId.id,
          stripePriceId: sp.stripe_price_id ?? null,
          stripeName: byId.name,
          stripePrice: null,
          action: 'Crear precio EUR + guardar price_id',
          match: 'Por ID',
        })
        continue
      }

      plan.push({
        supabaseId: sp.id,
        supabaseName: sp.name,
        supabasePrice: sp.price,
        stripeProductId: byId.id,
        stripePriceId: eur.priceId,
        stripeName: byId.name,
        stripePrice: eur.price,
        action: sp.stripe_price_id === eur.priceId ? 'Mantener' : 'Actualizar IDs (match por nombre)',
        match: 'Por ID',
      })
      continue
    }

    const candidates = stripeByNormalizedName.get(normalized) ?? []
    if (candidates.length === 1) {
      const candidate = candidates[0]
      const eur = await resolveStripeEurPrice(stripeClient, candidate, null)
      plan.push({
        supabaseId: sp.id,
        supabaseName: sp.name,
        supabasePrice: sp.price,
        stripeProductId: candidate.id,
        stripePriceId: eur?.priceId ?? null,
        stripeName: candidate.name,
        stripePrice: eur?.price ?? null,
        action: 'Actualizar IDs (match por nombre)',
        match: 'Por nombre normalizado',
      })
      continue
    }

    if (candidates.length > 1) {
      const exactNameMatches = candidates.filter((c) => c.name === sp.name)
      if (exactNameMatches.length === 1) {
        const candidate = exactNameMatches[0]
        const eur = await resolveStripeEurPrice(stripeClient, candidate, null)
        plan.push({
          supabaseId: sp.id,
          supabaseName: sp.name,
          supabasePrice: sp.price,
          stripeProductId: candidate.id,
          stripePriceId: eur?.priceId ?? null,
          stripeName: candidate.name,
          stripePrice: eur?.price ?? null,
          action: 'Actualizar IDs (match por nombre)',
          match: 'Por nombre normalizado',
        })
        continue
      }

      const pricedCandidates: Array<{
        product: Stripe.Product
        eurPrice: { priceId: string; price: number } | null
        delta: number
      }> = []
      for (const c of candidates) {
        const eur = await resolveStripeEurPrice(stripeClient, c, null)
        const delta = eur ? Math.abs(eur.price - sp.price) : Number.POSITIVE_INFINITY
        pricedCandidates.push({ product: c, eurPrice: eur, delta })
      }
      pricedCandidates.sort((a, b) => {
        if (a.delta !== b.delta) return a.delta - b.delta
        return b.product.created - a.product.created
      })

      const best = pricedCandidates[0]
      if (best && Number.isFinite(best.delta)) {
        plan.push({
          supabaseId: sp.id,
          supabaseName: sp.name,
          supabasePrice: sp.price,
          stripeProductId: best.product.id,
          stripePriceId: best.eurPrice?.priceId ?? null,
          stripeName: best.product.name,
          stripePrice: best.eurPrice?.price ?? null,
          action: 'Actualizar IDs (match por nombre)',
          match: 'Por nombre normalizado',
        })
        continue
      }

      plan.push({
        supabaseId: sp.id,
        supabaseName: sp.name,
        supabasePrice: sp.price,
        stripeProductId: null,
        stripePriceId: null,
        stripeName: null,
        stripePrice: null,
        action: 'Ambiguo (revisión manual)',
        match: 'Ambiguo',
      })
      continue
    }

    plan.push({
      supabaseId: sp.id,
      supabaseName: sp.name,
      supabasePrice: sp.price,
      stripeProductId: null,
      stripePriceId: null,
      stripeName: null,
      stripePrice: null,
      action: 'Crear en Stripe + guardar IDs',
      match: 'Ninguno',
    })
  }

  const summary = plan.reduce(
    (acc, row) => {
      acc[row.action] = (acc[row.action] ?? 0) + 1
      return acc
    },
    {} as Record<PlanRow['action'], number>,
  )

  return { plan, summary }
}

export async function GET(req: Request) {
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

  const url = new URL(req.url)
  const onlyMissingIds = url.searchParams.get('onlyMissingIds') === '1'

  const { data: dbProducts, error: dbError } = await supabase
    .from('products')
    .select('id,name,price,description,stripe_product_id,stripe_price_id')

  if (dbError) {
    if (isMissingProductsTable(dbError.message)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase table public.products no existe o no está accesible.',
          setup: { sql: setupSql() },
        },
        { status: 200 },
      )
    }
    return NextResponse.json({ success: false, error: dbError.message }, { status: 200 })
  }

  const supabaseProducts = z.array(supabaseProductSchema).parse(dbProducts ?? [])
  const { plan, summary } = await buildPlan({ stripeClient, supabaseProducts, onlyMissingIds })
  const stats = await getSupabaseStripeIdStats(supabase)

  console.table(
    plan.slice(0, 30).map((r) => ({
      supabaseName: r.supabaseName,
      action: r.action,
      match: r.match,
      stripeName: r.stripeName ?? '',
      supabasePrice: r.supabasePrice,
      stripePrice: r.stripePrice ?? '',
    })),
  )

  return NextResponse.json({ success: true, dryRun: true, summary, plan, stats })
}

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ success: false, error: 'Stripe not configured' }, { status: 500 })
  }

  const stripeClient = stripe
  const token = req.headers.get('x-sync-token') || ''
  const requiredToken = process.env.SYNC_PRICES_TOKEN || process.env.SEED_DB_TOKEN || ''

  let body: z.infer<typeof postBodySchema> = {}
  try {
    body = postBodySchema.parse(await req.json().catch(() => ({})))
  } catch {
    body = {}
  }

  const url = new URL(req.url)
  const dryRun = body.dryRun ?? url.searchParams.get('dryRun') === '1'
  const onlyMissingIds = body.onlyMissingIds ?? url.searchParams.get('onlyMissingIds') === '1'

  if (!dryRun) {
    if (!requiredToken || token !== requiredToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  let supabase: ReturnType<typeof createSupabaseServerClient>
  try {
    supabase = createSupabaseServerClient()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Supabase server client not configured'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  const { data: dbProducts, error: dbError } = await supabase
    .from('products')
    .select('id,name,price,description,stripe_product_id,stripe_price_id')

  if (dbError) {
    if (isMissingProductsTable(dbError.message)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase table public.products no existe o no está accesible.',
          setup: { sql: setupSql() },
        },
        { status: 200 },
      )
    }
    return NextResponse.json({ success: false, error: dbError.message }, { status: 200 })
  }

  const supabaseProducts = z.array(supabaseProductSchema).parse(dbProducts ?? [])
  const { plan, summary } = await buildPlan({ stripeClient, supabaseProducts, onlyMissingIds })

  if (dryRun) {
    return NextResponse.json({ success: true, dryRun: true, summary, plan })
  }

  if (plan.length > 0) {
    const { data: preflightData, error: preflightError } = await supabase
      .from('products')
      .update({ stripe_product_id: null })
      .eq('id', plan[0].supabaseId)
      .select('id')

    const preflightErrorMessage =
      preflightError && typeof (preflightError as unknown as { message?: unknown }).message === 'string'
        ? ((preflightError as unknown as { message: string }).message)
        : ''

    const preflightBlocked =
      !!preflightErrorMessage ||
      !Array.isArray(preflightData) ||
      preflightData.length === 0 ||
      preflightErrorMessage.toLowerCase().includes('row-level security')

    if (preflightBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: preflightErrorMessage || 'Supabase write blocked (RLS or permissions)',
          setup: {
            sql: [
              'alter table public.products disable row level security;',
              '-- Ejecuta el sync y después vuelve a activar RLS',
              'alter table public.products enable row level security;',
            ].join('\n'),
          },
        },
        { status: 500 },
      )
    }
  }

  const applied: PlanRow[] = []

  for (const row of plan) {
    if (row.action === 'Mantener') continue
    if (row.action === 'Ambiguo (revisión manual)') continue
    if (row.action === 'Stripe ID inválido (revisión manual)') continue

    if (row.action === 'Actualizar IDs (match por nombre)') {
      if (!row.stripeProductId) continue
      const { data, error } = await supabase
        .from('products')
        .update({ stripe_product_id: row.stripeProductId, stripe_price_id: row.stripePriceId })
        .eq('id', row.supabaseId)
        .select('id')
      if (!error && Array.isArray(data) && data.length > 0) applied.push(row)
      continue
    }

    if (row.action === 'Crear precio EUR + guardar price_id') {
      if (!row.stripeProductId) continue
      const newPrice = await stripeClient.prices.create({
        currency: 'eur',
        unit_amount: euroToUnitAmount(row.supabasePrice),
        product: row.stripeProductId,
      })
      await stripeClient.products.update(row.stripeProductId, { default_price: newPrice.id })
      const { data, error } = await supabase
        .from('products')
        .update({ stripe_price_id: newPrice.id })
        .eq('id', row.supabaseId)
        .select('id')
      if (!error && Array.isArray(data) && data.length > 0)
        applied.push({ ...row, stripePriceId: newPrice.id, stripePrice: row.supabasePrice })
      continue
    }

    if (row.action === 'Crear en Stripe + guardar IDs') {
      const source = supabaseProducts.find((p) => p.id === row.supabaseId)
      if (!source) continue
      const createdProduct = await stripeClient.products.create({
        name: source.name,
        description: source.description ?? undefined,
        active: true,
        metadata: { supabase_product_id: source.id },
      })
      const createdPrice = await stripeClient.prices.create({
        currency: 'eur',
        unit_amount: euroToUnitAmount(source.price),
        product: createdProduct.id,
      })
      await stripeClient.products.update(createdProduct.id, { default_price: createdPrice.id })
      const { data, error } = await supabase
        .from('products')
        .update({ stripe_product_id: createdProduct.id, stripe_price_id: createdPrice.id })
        .eq('id', source.id)
        .select('id')
      if (!error) {
        applied.push({
          ...row,
          stripeProductId: createdProduct.id,
          stripePriceId: createdPrice.id,
          stripeName: createdProduct.name,
          stripePrice: source.price,
          match: 'Ninguno',
        })
      }
      continue
    }
  }

  const statsAfter = await getSupabaseStripeIdStats(supabase)
  return NextResponse.json({
    success: true,
    dryRun: false,
    summary,
    appliedCount: applied.length,
    applied,
    statsAfter,
  })
}
