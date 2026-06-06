import { WEB_COLLECTIONS } from '@/lib/web-collections'
import {
  BANNER_CORALES,
  BANNER_FILIPA,
  BANNER_MAREBO,
  HERO_DESCARA,
  HERO_JAIPUR_LEFT,
  HERO_JAIPUR_RIGHT,
} from '@/lib/home-page-images'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getServiceSupabase } from '@/lib/admin/server'

const COLLECTION_SELECT =
  'id,slug,label,description,hero_image_left,hero_image_right,is_active,sort_order,homepage_order,visible_on_homepage,visible_on_site'

export interface CollectionRecord {
  id: string
  slug: string
  label: string
  description: string | null
  hero_image_left: string | null
  hero_image_right: string | null
  /** Legacy; mantener sincronizado con visible_on_site en admin */
  is_active: boolean
  sort_order: number
  /** 1 = hero principal en home; 2+ = banners de portada */
  homepage_order: number
  visible_on_homepage: boolean
  visible_on_site: boolean
}

export interface CollectionOption {
  slug: string
  label: string
}

const PORTADA_HERO_BY_SLUG: Record<string, { left?: string; right?: string }> = {
  jaipur: { left: HERO_JAIPUR_LEFT, right: HERO_JAIPUR_RIGHT },
  descara: { left: HERO_DESCARA },
  corales: { left: BANNER_CORALES },
  marebo: { left: BANNER_MAREBO },
  filipa: { left: BANNER_FILIPA },
}

const FALLBACK: CollectionRecord[] = WEB_COLLECTIONS.map((c, i) => {
  const hero = PORTADA_HERO_BY_SLUG[c.slug]
  return {
    id: c.slug,
    slug: c.slug,
    label: c.label,
    description: null,
    hero_image_left: hero?.left ?? null,
    hero_image_right: hero?.right ?? null,
    is_active: true,
    sort_order: (i + 1) * 10,
    homepage_order: i + 1,
    visible_on_homepage: true,
    visible_on_site: true,
  }
})

const LEGACY_COLLECTION_LABELS: Record<string, string> = {
  'lost-in-jaipur': 'Jaipur',
}

export function fallbackCollectionBySlug(slug: string): CollectionRecord | null {
  const normalized = String(slug ?? '').toLowerCase().trim()
  const found = FALLBACK.find((c) => c.slug === normalized)
  if (found) return found
  const label = LEGACY_COLLECTION_LABELS[normalized]
  if (!label) return null
  const hero = PORTADA_HERO_BY_SLUG.jaipur
  return {
    id: normalized,
    slug: normalized,
    label,
    description: null,
    hero_image_left: hero?.left ?? null,
    hero_image_right: hero?.right ?? null,
    is_active: true,
    sort_order: 100,
    homepage_order: 100,
    visible_on_homepage: false,
    visible_on_site: true,
  }
}

function mapRow(row: Record<string, unknown>): CollectionRecord {
  const visibleOnSite = row.visible_on_site !== false && row.is_active !== false
  return {
    id: String(row.id ?? row.slug),
    slug: String(row.slug ?? '').toLowerCase().trim(),
    label: String(row.label ?? row.slug ?? ''),
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

/** Jaipur legacy comparte visibilidad con slug jaipur */
export function productCollectionMatchesSlug(productSlug: string, collectionSlug: string): boolean {
  const p = productSlug.toLowerCase().trim()
  const c = collectionSlug.toLowerCase().trim()
  if (p === c) return true
  if (c === 'jaipur' && p === 'lost-in-jaipur') return true
  if (c === 'lost-in-jaipur' && p === 'jaipur') return true
  return false
}

export function collectionSlugsForProductFilter(collectionSlug: string): string[] {
  const s = collectionSlug.toLowerCase().trim()
  if (s === 'jaipur') return ['jaipur', 'lost-in-jaipur']
  return [s]
}

export { slugifyCollectionLabel } from '@/lib/collection-slug'

export async function fetchCollectionsVisibleOnSite(): Promise<CollectionRecord[]> {
  try {
    const sb = createSupabaseServerClient()
    const { data, error } = await sb
      .from('collections')
      .select(COLLECTION_SELECT)
      .eq('visible_on_site', true)
      .order('homepage_order', { ascending: true })
    if (error || !data?.length) return FALLBACK.filter((c) => c.visible_on_site)
    return data.map((row) => mapRow(row as Record<string, unknown>))
  } catch {
    return FALLBACK.filter((c) => c.visible_on_site)
  }
}

/** @deprecated Usar fetchCollectionsVisibleOnSite */
export async function fetchActiveCollections(): Promise<CollectionRecord[]> {
  return fetchCollectionsVisibleOnSite()
}

/** Colecciones que aparecen en la portada (home), ordenadas */
export async function fetchHomepagePortadaCollections(): Promise<CollectionRecord[]> {
  try {
    const sb = createSupabaseServerClient()
    const { data, error } = await sb
      .from('collections')
      .select(COLLECTION_SELECT)
      .eq('visible_on_site', true)
      .eq('visible_on_homepage', true)
      .order('homepage_order', { ascending: true })
    if (error || !data?.length) {
      return FALLBACK.filter((c) => c.visible_on_homepage && c.visible_on_site).sort(
        (a, b) => a.homepage_order - b.homepage_order,
      )
    }
    return data.map((row) => mapRow(row as Record<string, unknown>))
  } catch {
    return FALLBACK.filter((c) => c.visible_on_homepage && c.visible_on_site).sort(
      (a, b) => a.homepage_order - b.homepage_order,
    )
  }
}

export async function fetchAllCollectionsAdmin(): Promise<CollectionRecord[]> {
  try {
    const sb = getServiceSupabase()
    const { data, error } = await sb
      .from('collections')
      .select(COLLECTION_SELECT)
      .order('homepage_order', { ascending: true })
    if (error || !data?.length) return FALLBACK
    return data.map((row) => mapRow(row as Record<string, unknown>))
  } catch {
    return FALLBACK
  }
}

export async function getHiddenCollectionSlugs(): Promise<Set<string>> {
  try {
    const sb = getServiceSupabase()
    const { data, error } = await sb.from('collections').select('slug,visible_on_site').eq('visible_on_site', false)
    if (error || !data?.length) return new Set()
    return new Set(data.map((r) => String((r as { slug: string }).slug).toLowerCase().trim()))
  } catch {
    return new Set()
  }
}

export async function isCollectionVisibleOnSite(slug: string): Promise<boolean> {
  const normalized = String(slug ?? '').toLowerCase().trim()
  const row = await fetchCollectionBySlug(normalized)
  return row?.visible_on_site ?? true
}

export async function fetchCollectionBySlugAdmin(slug: string): Promise<CollectionRecord | null> {
  const normalized = String(slug ?? '').toLowerCase().trim()
  const rows = await fetchAllCollectionsAdmin()
  return rows.find((r) => r.slug === normalized) ?? null
}

/**
 * Colección pública por slug. Usa Supabase si existe la tabla; si no, fallback local.
 * Devuelve null solo si el slug es desconocido o la colección está oculta en web (visible_on_site).
 */
export async function fetchCollectionBySlug(slug: string): Promise<CollectionRecord | null> {
  const normalized = String(slug ?? '').toLowerCase().trim()
  if (!normalized) return null

  const localFallback = fallbackCollectionBySlug(normalized)

  try {
    const sb = createSupabaseServerClient()
    const { data, error } = await sb
      .from('collections')
      .select(COLLECTION_SELECT)
      .ilike('slug', normalized)
      .maybeSingle()

    if (error) {
      return localFallback?.visible_on_site ? localFallback : null
    }

    if (!data) {
      return localFallback?.visible_on_site ? localFallback : null
    }

    const mapped = mapRow(data as Record<string, unknown>)
    if (!mapped.visible_on_site) return null
    return mapped
  } catch {
    return localFallback?.visible_on_site ? localFallback : null
  }
}

export async function getAllowedCollectionSlugs(): Promise<Set<string>> {
  const rows = await fetchAllCollectionsAdmin()
  const slugs = new Set(rows.map((r) => r.slug))
  slugs.add('lost-in-jaipur')
  return slugs
}

export async function getNextHomepageOrder(): Promise<number> {
  const rows = await fetchAllCollectionsAdmin()
  const max = rows.reduce((m, r) => Math.max(m, r.homepage_order), 0)
  return max + 1
}

export function toCollectionOptions(rows: CollectionRecord[]): CollectionOption[] {
  return rows.map((r) => ({ slug: r.slug, label: r.label }))
}

export { portadaImageUrls } from '@/lib/portada-image-urls'
