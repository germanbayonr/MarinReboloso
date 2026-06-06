/** Utilidad compartida sin dependencias de servidor (segura para Client Components). */

export interface PortadaImageFields {
  hero_image_left: string | null
  hero_image_right: string | null
  homepage_order: number
}

export function portadaImageUrls(collections: PortadaImageFields[]): string[] {
  const urls: string[] = []
  for (const c of collections) {
    if (c.hero_image_left?.trim()) urls.push(c.hero_image_left.trim())
    if (c.homepage_order === 1 && c.hero_image_right?.trim()) urls.push(c.hero_image_right.trim())
  }
  return urls
}
