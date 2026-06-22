import { NextResponse } from 'next/server'
import { buildSiteCatalogSnapshot } from '@/lib/catalog-snapshot'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Snapshot único: productos + URLs de imágenes para precarga global. */
export async function GET() {
  try {
    const snapshot = await buildSiteCatalogSnapshot()
    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cargar catálogo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
