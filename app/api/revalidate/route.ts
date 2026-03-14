import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret') || req.headers.get('x-revalidate-secret') || ''
  const expected = process.env.REVALIDATION_SECRET || 'MareboClear2026'

  if (secret !== expected) {
    return NextResponse.json({ revalidated: false, error: 'Unauthorized' }, { status: 401 })
  }

  const paths = [
    '/',
    '/catalogo',
    '/carrito',
    '/cart',
    '/wishlist',
    '/categoria/pendientes',
    '/categoria/collares',
    '/categoria/mantones',
    '/categoria/peinecillos',
    '/categoria/bolsos',
  ] as const

  revalidatePath('/', 'layout')
  for (const p of paths) revalidatePath(p)

  return NextResponse.json({ revalidated: true, now: Date.now(), paths })
}
