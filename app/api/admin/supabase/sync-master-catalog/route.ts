import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { imageUrlFirstFromDatabase } from '@/lib/admin/product-image-db'
import { masterCatalog } from '@/lib/data/master-catalog'

function getSupabaseServiceClient(): any {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key =
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '').trim()

  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function normalizeName(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function sanitizeUrl(value: unknown) {
  return String(value ?? '').replace(/`/g, '').trim()
}

export async function POST(req: Request) {
  const token = req.headers.get('x-sync-token') || ''
  const requiredToken = process.env.SYNC_TOKEN || 'MareboReverse2026'
  if (token !== requiredToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseServiceClient()
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase service_role_key not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') !== '0'

  const byName = new Map<string, { image_url: string; collection: string | null; category: string | null }>()
  const duplicates = new Set<string>()

  for (const item of masterCatalog) {
    const key = normalizeName((item as any).name)
    if (!key) continue
    if (byName.has(key)) duplicates.add(key)
    else
      byName.set(key, {
        image_url: sanitizeUrl((item as any).image_url),
        collection: (item as any).collection ?? null,
        category: (item as any).category ?? null,
      })
  }

  for (const key of duplicates) byName.delete(key)

  const { data, error } = await supabase
    .from('products')
    .select('id,name,image_url,collection,category')
    .order('name', { ascending: true })
    .limit(10000)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const planned: Array<{
    id: string
    name: string
    before: { image_url: string | null; collection: string | null; category: string | null }
    after: { image_url: string; collection: string | null; category: string | null }
  }> = []

  const notInMaster: Array<{ id: string; name: string }> = []

  for (const row of data ?? []) {
    const name = String((row as any).name ?? '')
    const key = normalizeName(name)
    if (!key) continue
    const master = byName.get(key)
    if (!master) {
      notInMaster.push({ id: String((row as any).id), name })
      continue
    }

    const before = {
      image_url: imageUrlFirstFromDatabase((row as any).image_url),
      collection: (row as any).collection ?? null,
      category: (row as any).category ?? null,
    }
    const after = {
      image_url: master.image_url,
      collection: master.collection,
      category: master.category,
    }

    const changed =
      sanitizeUrl(before.image_url) !== sanitizeUrl(after.image_url) ||
      String(before.collection ?? '') !== String(after.collection ?? '') ||
      String(before.category ?? '') !== String(after.category ?? '')

    if (!changed) continue

    planned.push({ id: String((row as any).id), name, before, after })
  }

  if (!dryRun) {
    for (const item of planned) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          image_url: item.after.image_url ? [item.after.image_url.trim()] : null,
          collection: item.after.collection,
          category: item.after.category,
        })
        .eq('id', item.id)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message, failedId: item.id, failedName: item.name },
          { status: 500 },
        )
      }
    }
  }

  return NextResponse.json({
    success: true,
    dryRun,
    masterCount: byName.size,
    duplicateMasterNames: Array.from(duplicates.values()),
    matchedCount: planned.length,
    notInMasterCount: notInMaster.length,
    planned,
    notInMaster: notInMaster.slice(0, 200),
  })
}

