import { NextResponse } from 'next/server'
import { buildSiteCatalogSnapshot } from '@/lib/catalog-snapshot'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Snapshot único: productos + URLs de imágenes para precarga global. */
export async function GET() {
  try {
    const snapshot = await buildSiteCatalogSnapshot()
    const cacheControl = snapshot.fromFallback
      ? 'private, no-store, max-age=0'
      : 'public, s-maxage=300, stale-while-revalidate=600'
    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': cacheControl,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cargar catálogo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
