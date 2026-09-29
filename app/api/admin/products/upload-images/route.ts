import { NextResponse, type NextRequest } from 'next/server'
import { runUploadProductImages } from '@/lib/admin/product-upload-server'
import { jsonError, jsonOk, requireAdminApiContext } from '@/lib/admin/require-admin-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApiContext()
    if (!auth.ok) return auth.response

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return jsonError('FormData inválido')
    }

    const files = formData.getAll('images').filter((x): x is File => x instanceof File && x.size > 0)
    const result = await runUploadProductImages(auth.sb, files)
    if (!result.ok) return jsonError(result.error, 400)
    return jsonOk({ urls: result.urls })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno al subir imágenes'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
