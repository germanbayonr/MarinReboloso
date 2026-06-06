import { portadaImageUrls } from '@/lib/portada-image-urls'
import { HOME_PAGE_STATIC_IMAGE_URLS, imageUrlsFromProductRow } from '@/lib/home-page-images'
import { preloadImageUrls } from '@/lib/preload-images'
import { supabase } from '@/lib/supabase'

async function fetchNovedadesImageUrls(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(16)

  if (error || !data?.length) return []

  const urls: string[] = []
  for (const row of data) {
    urls.push(...imageUrlsFromProductRow((row as { image_url?: unknown }).image_url))
  }
  return urls
}

async function fetchPortadaImageUrls(): Promise<string[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('hero_image_left,hero_image_right,homepage_order')
    .eq('visible_on_site', true)
    .eq('visible_on_homepage', true)
    .order('homepage_order', { ascending: true })

  if (error || !data?.length) return []

  const rows = data.map((row) => ({
    hero_image_left: row.hero_image_left != null ? String(row.hero_image_left) : null,
    hero_image_right: row.hero_image_right != null ? String(row.hero_image_right) : null,
    homepage_order: Number(row.homepage_order) || 100,
  }))
  return portadaImageUrls(rows)
}

/** Precarga portada (DB), banners, Instagram y novedades durante el preloader. */
export async function preloadHomePageImages(): Promise<void> {
  const [novedadesUrls, portadaUrls] = await Promise.all([
    fetchNovedadesImageUrls(),
    fetchPortadaImageUrls(),
  ])
  await preloadImageUrls(
    [...new Set([...portadaUrls, ...HOME_PAGE_STATIC_IMAGE_URLS, ...novedadesUrls])],
    { concurrency: 8 },
  )
}
