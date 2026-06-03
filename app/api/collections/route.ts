import { NextResponse } from 'next/server'
import { fetchCollectionsVisibleOnSite, toCollectionOptions } from '@/lib/collections'

export const revalidate = 60

export async function GET() {
  const rows = await fetchCollectionsVisibleOnSite()
  return NextResponse.json(toCollectionOptions(rows), {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  })
}
