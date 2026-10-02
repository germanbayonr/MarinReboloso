import type { AdminProduct } from '@/lib/admin/types'

type ApiOk<T> = { ok: true } & T
type ApiErr = { ok: false; error?: string }

async function parseAdminProductResponse(res: Response): Promise<AdminProduct> {
  let data: ApiOk<{ product: AdminProduct }> | ApiErr
  try {
    data = (await res.json()) as ApiOk<{ product: AdminProduct }> | ApiErr
  } catch {
    throw new Error(`Respuesta inválida (${res.status})`)
  }
  if (!res.ok || !data.ok || !('product' in data) || !data.product) {
    throw new Error(('error' in data && data.error) || `Error ${res.status}`)
  }
  return data.product
}

export async function patchAdminProductViaApi(
  id: string,
  patch: { in_stock?: boolean; is_active?: boolean },
): Promise<AdminProduct> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(patch),
  })
  return parseAdminProductResponse(res)
}

export async function deleteAdminProductViaApi(id: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  let data: { ok?: boolean; error?: string }
  try {
    data = (await res.json()) as { ok?: boolean; error?: string }
  } catch {
    throw new Error(`Respuesta inválida (${res.status})`)
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Error ${res.status}`)
  }
}

export async function deleteManyAdminProductsViaApi(
  ids: string[],
): Promise<{ deletedCount: number; failures: Array<{ id: string; name?: string; error: string }> }> {
  const res = await fetch('/api/admin/products/delete-many', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ids }),
  })
  let data:
    | { ok: true; deletedCount: number; failures: Array<{ id: string; name?: string; error: string }> }
    | { ok: false; error?: string }
  try {
    data = (await res.json()) as typeof data
  } catch {
    throw new Error(`Respuesta inválida (${res.status})`)
  }
  if (!res.ok || !data.ok) {
    throw new Error(('error' in data && data.error) || `Error ${res.status}`)
  }
  return { deletedCount: data.deletedCount, failures: data.failures ?? [] }
}

export async function syncProductGalleryViaApi(
  id: string,
  input: {
    image_urls: string[]
    removed_urls: string[]
    update_stripe_image: boolean
  },
): Promise<AdminProduct> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}/gallery`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  })
  return parseAdminProductResponse(res)
}

export async function updateAdminProductViaApi(id: string, input: import('@/lib/admin/product-input').AdminProductInput): Promise<AdminProduct> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  })
  return parseAdminProductResponse(res)
}

export async function syncProductsWithStripeViaApi(): Promise<{
  success: boolean
  syncedCount: number
  failedSyncs: Array<{ name: string; reason: string }>
}> {
  const res = await fetch('/api/admin/products/sync-stripe', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  let data:
    | { ok: true; success: boolean; syncedCount: number; failedSyncs: Array<{ name: string; reason: string }> }
    | { ok: false; error?: string }
  try {
    data = (await res.json()) as typeof data
  } catch {
    throw new Error(`Respuesta inválida (${res.status})`)
  }
  if (!res.ok || !data.ok) {
    throw new Error(('error' in data && data.error) || `Error ${res.status}`)
  }
  return {
    success: data.success,
    syncedCount: data.syncedCount,
    failedSyncs: data.failedSyncs ?? [],
  }
}

export async function createAdminProductViaApi(
  input: import('@/lib/admin/product-input').AdminProductInput,
): Promise<string> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  })
  let data: { ok: true; id: string } | { ok: false; error?: string }
  try {
    data = (await res.json()) as typeof data
  } catch {
    throw new Error(`Respuesta inválida (${res.status})`)
  }
  if (!res.ok || !data.ok || !('id' in data) || !data.id) {
    throw new Error(('error' in data && data.error) || `Error ${res.status}`)
  }
  return data.id
}

export async function uploadAdminProductImagesViaApi(files: File[]): Promise<string[]> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('images', file, file.name || 'upload.jpg')
  }
  const res = await fetch('/api/admin/products/upload-images', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  })
  let data: { ok: true; urls: string[] } | { ok: false; error?: string }
  try {
    data = (await res.json()) as typeof data
  } catch {
    throw new Error(`Respuesta inválida (${res.status})`)
  }
  if (!res.ok || !data.ok || !Array.isArray(data.urls)) {
    throw new Error(('error' in data && data.error) || `Error ${res.status}`)
  }
  return data.urls
}
