import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validatePromoCodePublic } from '@/lib/promotions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const requestSchema = z.object({
  code: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { code } = requestSchema.parse(payload)
    const result = await validatePromoCodePublic(code)
    if (!result.isValid) {
      return NextResponse.json({ ok: false, error: 'Código promocional no válido.' }, { status: 400 })
    }
    return NextResponse.json({
      ok: true,
      code: result.code,
      discountPercentage: result.discountPercentage,
      promotionId: result.promotionId,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Código promocional no válido.' }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Error al validar promoción.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
