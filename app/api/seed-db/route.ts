import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readFile } from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function isSupabaseStorageUrl(value: string) {
  return value.startsWith('https://') && value.includes('.supabase.co/storage/v1/object/public/')
}

const seedItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().nonnegative(),
  image_url: z.string().min(1),
  category: z.string().min(1),
  is_new_arrival: z.boolean(),
  source: z.string().min(1),
  createdAt: z.string().nullable(),
})

type SeedItem = z.infer<typeof seedItemSchema>

function extractBetween(src: string, startNeedle: string, endNeedle: string) {
  const start = src.indexOf(startNeedle)
  if (start < 0) return null
  const end = src.indexOf(endNeedle, start)
  if (end < 0) return src.slice(start)
  return src.slice(start, end)
}

function extractField(block: string, re: RegExp) {
  const match = block.match(re)
  return match?.[1] ?? null
}

function extractFirstImageUrl(block: string) {
  const imagesBlock = extractField(block, /images:\s*\[([\s\S]*?)\]\s*,/i)
  if (!imagesBlock) return null
  const url = extractField(imagesBlock, /'([^']+)'/)
  return url && isSupabaseStorageUrl(url) ? url : null
}

function parseProductListingMock(src: string): SeedItem[] {
  const segment = extractBetween(src, 'const mockProducts', 'type Product')
  if (!segment) return []

  const out: SeedItem[] = []
  const categoryBlockRe = /([a-z0-9-]+)\s*:\s*\[([\s\S]*?)\]\s*,/gi
  let match: RegExpExecArray | null

  while ((match = categoryBlockRe.exec(segment))) {
    const categoryKey = match[1]
    const arrayBody = match[2]
    const objects = arrayBody.match(/\{[\s\S]*?\}\s*,?/g) ?? []

    for (const obj of objects) {
      const name = extractField(obj, /name:\s*'([^']+)'/i)
      const priceRaw = extractField(obj, /price:\s*(\d+(?:\.\d+)?)/i)
      const image = extractField(obj, /images:\s*\[\s*'([^']+)'/i)
      if (!name || !priceRaw || !image) continue
      if (!isSupabaseStorageUrl(image)) continue
      const price = Number(priceRaw)
      if (!Number.isFinite(price)) continue

      out.push({
        name,
        description: null,
        price,
        image_url: image,
        category: categoryKey,
        is_new_arrival: false,
        source: 'components/ProductListingClient.tsx',
        createdAt: null,
      })
    }
  }

  return out
}

function computeNewArrivals(items: SeedItem[], limit: number) {
  const sortable = items
    .filter((p) => p.createdAt && /^\d{4}-\d{2}-\d{2}$/.test(p.createdAt))
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const newest = new Set(sortable.slice(0, limit).map((p) => normalizeName(p.name)))

  return items.map((p) => ({
    ...p,
    is_new_arrival: newest.has(normalizeName(p.name)),
  }))
}

function dedupe(items: SeedItem[]) {
  const byKey = new Map<string, SeedItem>()
  const duplicates: Array<{ key: string; name: string; sources: string[] }> = []

  for (const item of items) {
    const key = normalizeName(item.name)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, item)
      continue
    }
    duplicates.push({ key, name: item.name, sources: [existing.source, item.source] })
  }

  return { items: Array.from(byKey.values()), duplicates }
}

async function collectSeedData() {
  const repoRoot = process.cwd()

  const productListingSrc = await readFile(path.join(repoRoot, 'components', 'ProductListingClient.tsx'), 'utf8').catch(
    () => '',
  )
  const fromContext: SeedItem[] = []
  const fromListing = productListingSrc ? parseProductListingMock(productListingSrc) : []

  const combined = computeNewArrivals([...fromContext, ...fromListing], 12)
  const { items, duplicates } = dedupe(combined)

  const summary = items.reduce(
    (acc, p) => {
      acc.total += 1
      acc.byCategory[p.category] = (acc.byCategory[p.category] ?? 0) + 1
      if (p.is_new_arrival) acc.newArrivals += 1
      return acc
    },
    { total: 0, newArrivals: 0, byCategory: {} as Record<string, number> },
  )

  return { items: z.array(seedItemSchema).parse(items), duplicates, summary }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') !== '0'

  const { items, duplicates, summary } = await collectSeedData()

  console.table(
    items.slice(0, 25).map((p) => ({
      name: p.name,
      category: p.category,
      price: p.price,
      is_new_arrival: p.is_new_arrival,
      source: p.source,
    })),
  )

  return NextResponse.json({
    success: true,
    dryRun,
    summary,
    duplicates,
    items,
  })
}

export async function POST(req: Request) {
  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') !== '0'

  const token = req.headers.get('x-seed-token') || ''
  const requiredToken = process.env.SEED_DB_TOKEN || ''

  if (!dryRun) {
    if (!requiredToken || token !== requiredToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { items, duplicates, summary } = await collectSeedData()
  if (dryRun) {
    return NextResponse.json({ success: true, dryRun: true, summary, duplicates, items })
  }

  const headerServiceKey =
    req.headers.get('x-supabase-service-role-key') ||
    req.headers.get('x-supabase-service-key') ||
    ''

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .trim()
    .replace(/^https:https:\/\//, 'https://')
    .replace(/^http:http:\/\//, 'http://')

  const supabase = headerServiceKey
    ? createClient(supabaseUrl, headerServiceKey, {
        auth: { persistSession: false },
      })
    : createSupabaseServerClient()

  const { data: existingRows, error: existingError } = await supabase.from('products').select('name')
  if (existingError) {
    return NextResponse.json({ success: false, error: existingError.message }, { status: 500 })
  }

  const existing = new Set((existingRows ?? []).map((r) => normalizeName(String((r as any).name ?? ''))))

  const payload = items
    .filter((p) => !existing.has(normalizeName(p.name)))
    .map((p) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      image_url: p.image_url,
      category: p.category,
      is_new_arrival: p.is_new_arrival,
      stripe_product_id: null,
      stripe_price_id: null,
    }))

  const { error: insertError } = await supabase.from('products').insert(payload)
  if (insertError) {
    if (insertError.message.toLowerCase().includes('row-level security')) {
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
          setup: {
            optionA: {
              title: 'Usar Service Role Key (recomendado)',
              requiredEnv: ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_URL'],
            },
            optionB: {
              title: 'Desactivar RLS temporalmente (solo para seed)',
              sql: [
                'alter table public.products disable row level security;',
                '-- Ejecuta el seed y después vuelve a activar RLS',
                'alter table public.products enable row level security;',
              ].join('\\n'),
            },
          },
        },
        { status: 500 },
      )
    }
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    dryRun: false,
    insertedCount: payload.length,
    skippedExistingCount: items.length - payload.length,
    summary,
  })
}
