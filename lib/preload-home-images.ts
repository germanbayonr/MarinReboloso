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

/** Precarga portada, banners, Instagram y novedades durante el preloader. */
export async function preloadHomePageImages(): Promise<void> {
  const novedadesUrls = await fetchNovedadesImageUrls()
  await preloadImageUrls([...HOME_PAGE_STATIC_IMAGE_URLS, ...novedadesUrls], { concurrency: 8 })
}
