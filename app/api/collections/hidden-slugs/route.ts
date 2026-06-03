import { NextResponse } from 'next/server'
import { getHiddenCollectionSlugs } from '@/lib/collections'

export const revalidate = 30

export async function GET() {
  const hidden = await getHiddenCollectionSlugs()
  return NextResponse.json(Array.from(hidden), {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  })
}
