/** URLs de imágenes de la página de inicio (portada + secciones). Fuente única para preload y componentes. */

export const HERO_JAIPUR_LEFT =
  'https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur(1).jpg'

export const HERO_JAIPUR_RIGHT =
  'https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur.PNG'

export const HERO_DESCARA =
  'https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Pasion%202.jpg'

export const BANNER_CORALES =
  'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Sky%202.JPG'

export const BANNER_MAREBO =
  'https://marebo.b-cdn.net/Colecciones/MAREBO/Flor%20MAREBO%20Dore.jpg'

export const BANNER_FILIPA =
  'https://marebo.b-cdn.net/Colecciones/Filipa/Pendientes-Linaje-Carmesi%202.png'

export const INSTAGRAM_POST_IMAGES = [
  'https://marebo.b-cdn.net/Ima%CC%81genes%20Insta/Insta1.png',
  'https://marebo.b-cdn.net/Ima%CC%81genes%20Insta/Insta2.png',
  'https://marebo.b-cdn.net/Logo/Captura%20de%20pantalla%202026-03-10%20a%20las%2011.28.12.jpg',
  'https://marebo.b-cdn.net/Ima%CC%81genes%20Insta/Insta4.png',
  'https://marebo.b-cdn.net/Ima%CC%81genes%20Insta/Insta5.png',
  'https://marebo.b-cdn.net/Ima%CC%81genes%20Insta/Insta6%20.png',
  'https://marebo.b-cdn.net/Ima%CC%81genes%20Insta/Insta7.png',
  'https://marebo.b-cdn.net/Ima%CC%81genes%20Insta/Insta8.png',
] as const

/** Todas las imágenes estáticas de la home (sin novedades del catálogo). */
export const HOME_PAGE_STATIC_IMAGE_URLS: string[] = [
  HERO_JAIPUR_LEFT,
  HERO_JAIPUR_RIGHT,
  HERO_DESCARA,
  BANNER_CORALES,
  BANNER_MAREBO,
  BANNER_FILIPA,
  ...INSTAGRAM_POST_IMAGES,
]

export function imageUrlsFromProductRow(imageUrl: unknown): string[] {
  if (imageUrl == null) return []
  if (typeof imageUrl === 'string') {
    const t = imageUrl.trim()
    return t ? [t] : []
  }
  if (Array.isArray(imageUrl)) {
    return imageUrl
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}
