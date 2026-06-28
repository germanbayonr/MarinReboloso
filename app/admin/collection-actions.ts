'use server'

import { revalidatePath } from 'next/cache'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import { logAdminSupabaseIssue } from '@/lib/admin/supabase-admin-log'
import { slugifyCollectionLabel } from '@/lib/collection-slug'
import { removeProductImagesFromSupabaseStorage } from '@/lib/admin/remove-product-storage-images'
import { uploadOptimizedAdminImages } from '@/lib/admin/upload-optimized-admin-images'
import { clearHiddenCollectionSlugCache } from '@/lib/product-collection-visibility'
import type { CollectionRecord } from '@/lib/collections'

function collectionHeroUrls(row: {
  hero_image_left?: string | null
  hero_image_right?: string | null
}): string[] {
  return [row.hero_image_left, row.hero_image_right]
    .map((url) => (url != null ? String(url).trim() : ''))
    .filter(Boolean)
}

function orphanedHeroUrls(
  previous: { hero_image_left?: string | null; hero_image_right?: string | null },
  nextLeft: string | null,
  nextRight: string | null,
): string[] {
  const nextUrls = new Set([nextLeft, nextRight].filter(Boolean))
  return collectionHeroUrls(previous).filter((url) => !nextUrls.has(url))
}

async function uploadCollectionImages(
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const sb = getServiceSupabase()
  return uploadOptimizedAdminImages(sb, files, 'collections')
}

function revalidateCollectionPaths(slug?: string) {
  revalidatePath('/admin/colecciones')
  revalidatePath('/')
  revalidatePath('/catalogo')
  if (slug) {
    revalidatePath(`/coleccion/${slug}`)
    revalidatePath(`/admin/colecciones/${slug}`)
  }
}

function mapCollectionRow(row: Record<string, unknown>): CollectionRecord {
  const visibleOnSite = row.visible_on_site !== false && row.is_active !== false
  return {
    id: String(row.id),
    slug: String(row.slug ?? '').toLowerCase().trim(),
    label: String(row.label ?? ''),
    description: row.description != null ? String(row.description) : null,
    hero_image_left: row.hero_image_left != null ? String(row.hero_image_left).trim() || null : null,
    hero_image_right: row.hero_image_right != null ? String(row.hero_image_right).trim() || null : null,
    is_active: visibleOnSite,
    sort_order: Number(row.sort_order) || 0,
    homepage_order: Number(row.homepage_order) || Number(row.sort_order) || 100,
    visible_on_homepage: row.visible_on_homepage !== false,
    visible_on_site: visibleOnSite,
  }
}

function afterCollectionMutation(slug?: string) {
  clearHiddenCollectionSlugCache()
  revalidateCollectionPaths(slug)
}

export type CreateCollectionInput = {
  label: string
  slug?: string
  description?: string | null
  hero_image_left?: string | null
  hero_image_right?: string | null
  is_active?: boolean
  sort_order?: number
  homepage_order?: number
  visible_on_homepage?: boolean
  visible_on_site?: boolean
  /** IDs de productos a asignar a esta colección al crear */
  product_ids?: string[]
}

export async function adminCreateCollection(
  input: CreateCollectionInput,
): Promise<{ ok: true; collection: CollectionRecord } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const label = String(input.label ?? '').trim()
  if (!label) return { ok: false, error: 'El nombre de la colección es obligatorio.' }

  const slug = (input.slug?.trim() || slugifyCollectionLabel(label)).toLowerCase()
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: 'Slug no válido. Usa solo letras minúsculas, números y guiones.' }
  }

  const visibleOnSite = input.visible_on_site !== false
  const sb = getServiceSupabase()
  const { data, error } = await sb
    .from('collections')
    .insert({
      slug,
      label,
      description: input.description?.trim() || null,
      hero_image_left: input.hero_image_left?.trim() || null,
      hero_image_right: input.hero_image_right?.trim() || null,
      is_active: visibleOnSite,
      sort_order: Number(input.sort_order) || Number(input.homepage_order) || 100,
      homepage_order: Number(input.homepage_order) || 100,
      visible_on_homepage: input.visible_on_homepage !== false,
      visible_on_site: visibleOnSite,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Ya existe una colección con ese slug.' }
    if (error.code === 'PGRST205' || error.message.includes("Could not find the table 'public.collections'")) {
      logAdminSupabaseIssue('COLLECTION_CREATE_MISSING_TABLE', error.message, { slug })
      return {
        ok: false,
        error:
          'La tabla collections no existe en Supabase. Ejecuta scripts/collections-migration-combined.sql en el SQL Editor del proyecto (o npm run db:collections con DATABASE_URL en .env.local).',
      }
    }
    logAdminSupabaseIssue('COLLECTION_CREATE', error.message, { slug })
    return { ok: false, error: error.message }
  }

  const productIds = (input.product_ids ?? []).filter(Boolean)
  if (productIds.length > 0) {
    const { error: assignErr } = await sb.from('products').update({ collection: slug }).in('id', productIds)
    if (assignErr) {
      logAdminSupabaseIssue('COLLECTION_ASSIGN_PRODUCTS', assignErr.message, { slug, count: productIds.length })
    }
  }

  afterCollectionMutation(slug)
  return { ok: true, collection: mapCollectionRow((data ?? {}) as Record<string, unknown>) }
}

function collectionProductSlugs(slug: string): string[] {
  const normalized = slug.toLowerCase().trim()
  if (normalized === 'jaipur') return ['jaipur', 'lost-in-jaipur']
  return [normalized]
}

export async function adminDeleteCollection(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const normalized = String(slug ?? '').toLowerCase().trim()
  if (!normalized) return { ok: false, error: 'Slug inválido.' }

  const sb = getServiceSupabase()
  const productSlugs = collectionProductSlugs(normalized)

  const { data: existingRow } = await sb
    .from('collections')
    .select('hero_image_left, hero_image_right')
    .ilike('slug', normalized)
    .maybeSingle()
  const heroUrlsToRemove = existingRow ? collectionHeroUrls(existingRow) : []

  for (const productSlug of productSlugs) {
    const { error: unassignErr } = await sb
      .from('products')
      .update({ collection: null })
      .ilike('collection', productSlug)
    if (unassignErr) {
      logAdminSupabaseIssue('COLLECTION_UNASSIGN_PRODUCTS', unassignErr.message, { slug: normalized, productSlug })
      return { ok: false, error: unassignErr.message }
    }
  }

  const { error: deleteErr } = await sb.from('collections').delete().ilike('slug', normalized)
  if (deleteErr) {
    if (deleteErr.code === 'PGRST205' || deleteErr.message.includes("Could not find the table 'public.collections'")) {
      return { ok: false, error: 'La tabla collections no existe en Supabase.' }
    }
    logAdminSupabaseIssue('COLLECTION_DELETE', deleteErr.message, { slug: normalized })
    return { ok: false, error: deleteErr.message }
  }

  if (heroUrlsToRemove.length > 0) {
    const removed = await removeProductImagesFromSupabaseStorage(sb, heroUrlsToRemove)
    if (!removed.ok) {
      logAdminSupabaseIssue('COLLECTION_DELETE_STORAGE', removed.error, { slug: normalized })
    }
  }

  afterCollectionMutation(normalized)
  return { ok: true }
}

export async function adminUpdateCollection(
  slug: string,
  input: Partial<CreateCollectionInput>,
): Promise<{ ok: true; collection: CollectionRecord } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const normalized = String(slug ?? '').toLowerCase().trim()
  if (!normalized) return { ok: false, error: 'Slug inválido.' }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.label != null) patch.label = String(input.label).trim()
  if (input.description !== undefined) patch.description = input.description?.trim() || null
  if (input.hero_image_left !== undefined) patch.hero_image_left = input.hero_image_left?.trim() || null
  if (input.hero_image_right !== undefined) patch.hero_image_right = input.hero_image_right?.trim() || null
  if (input.visible_on_site !== undefined) {
    patch.visible_on_site = input.visible_on_site
    patch.is_active = input.visible_on_site
  } else if (input.is_active !== undefined) {
    patch.is_active = input.is_active
    patch.visible_on_site = input.is_active
  }
  if (input.visible_on_homepage !== undefined) patch.visible_on_homepage = input.visible_on_homepage
  if (input.homepage_order !== undefined) {
    const order = Math.max(1, Math.floor(Number(input.homepage_order) || 1))
    patch.homepage_order = order
    if (order !== 1) patch.hero_image_right = null
  }
  if (input.sort_order !== undefined) patch.sort_order = Number(input.sort_order) || 0

  const sb = getServiceSupabase()

  const heroFieldsChanging =
    input.hero_image_left !== undefined ||
    input.hero_image_right !== undefined ||
    (input.homepage_order !== undefined && Math.max(1, Math.floor(Number(input.homepage_order) || 1)) !== 1)

  let urlsToRemove: string[] = []
  if (heroFieldsChanging) {
    const { data: currentRow } = await sb
      .from('collections')
      .select('hero_image_left, hero_image_right')
      .ilike('slug', normalized)
      .maybeSingle()
    if (currentRow) {
      const nextLeft =
        input.hero_image_left !== undefined
          ? input.hero_image_left?.trim() || null
          : currentRow.hero_image_left != null
            ? String(currentRow.hero_image_left).trim() || null
            : null
      let nextRight =
        input.hero_image_right !== undefined
          ? input.hero_image_right?.trim() || null
          : currentRow.hero_image_right != null
            ? String(currentRow.hero_image_right).trim() || null
            : null
      if (input.homepage_order !== undefined) {
        const order = Math.max(1, Math.floor(Number(input.homepage_order) || 1))
        if (order !== 1) nextRight = null
      }
      urlsToRemove = orphanedHeroUrls(currentRow, nextLeft, nextRight)
    }
  }

  const { data, error } = await sb.from('collections').update(patch).ilike('slug', normalized).select('*').single()
  if (error) return { ok: false, error: error.message }

  if (urlsToRemove.length > 0) {
    const removed = await removeProductImagesFromSupabaseStorage(sb, urlsToRemove)
    if (!removed.ok) {
      logAdminSupabaseIssue('COLLECTION_HERO_STORAGE_REMOVE', removed.error, { slug: normalized })
    }
  }

  afterCollectionMutation(normalized)
  return { ok: true, collection: mapCollectionRow((data ?? {}) as Record<string, unknown>) }
}

export async function adminUploadCollectionHeroImages(
  formData: FormData,
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const files = formData.getAll('images').filter((x): x is File => x instanceof File && x.size > 0)
  if (files.length === 0) return { ok: false, error: 'Selecciona al menos una imagen.' }
  return uploadCollectionImages(files)
}

export async function adminCreateCollectionWithImages(
  formData: FormData,
): Promise<{ ok: true; collection: CollectionRecord } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()

  const label = String(formData.get('label') ?? '').trim()
  const slugRaw = String(formData.get('slug') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const productIdsRaw = String(formData.get('product_ids') ?? '').trim()
  const product_ids = productIdsRaw ? productIdsRaw.split(',').map((id) => id.trim()).filter(Boolean) : []

  const homepage_order = Math.max(1, Number(formData.get('homepage_order')) || 100)
  const isHeroMain = homepage_order === 1

  const leftFile = formData.get('hero_left')
  const rightFile = formData.get('hero_right')
  const portadaFile = formData.get('hero_portada')
  const files: File[] = []
  if (isHeroMain) {
    if (leftFile instanceof File && leftFile.size > 0) files.push(leftFile)
    if (rightFile instanceof File && rightFile.size > 0) files.push(rightFile)
  } else if (portadaFile instanceof File && portadaFile.size > 0) {
    files.push(portadaFile)
  } else if (leftFile instanceof File && leftFile.size > 0) {
    files.push(leftFile)
  }

  let hero_image_left = String(formData.get('hero_image_left') ?? '').trim() || null
  let hero_image_right = isHeroMain ? String(formData.get('hero_image_right') ?? '').trim() || null : null

  if (files.length > 0) {
    const uploaded = await uploadCollectionImages(files)
    if (!uploaded.ok) return uploaded
    if (isHeroMain) {
      if (leftFile instanceof File && leftFile.size > 0) hero_image_left = uploaded.urls[0] ?? hero_image_left
      if (rightFile instanceof File && rightFile.size > 0) {
        const rightIndex = leftFile instanceof File && leftFile.size > 0 ? 1 : 0
        hero_image_right = uploaded.urls[rightIndex] ?? hero_image_right
      }
    } else {
      hero_image_left = uploaded.urls[0] ?? hero_image_left
      hero_image_right = null
    }
  }
  const visible_on_homepage = String(formData.get('visible_on_homepage') ?? 'true') !== 'false'
  const visible_on_site = String(formData.get('visible_on_site') ?? 'true') !== 'false'

  return adminCreateCollection({
    label,
    slug: slugRaw || undefined,
    description,
    hero_image_left,
    hero_image_right,
    product_ids,
    homepage_order,
    visible_on_homepage,
    visible_on_site,
  })
}
