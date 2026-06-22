import { HOME_PAGE_STATIC_IMAGE_URLS } from '@/lib/home-page-images'

/** Enlaces de precarga en HTML para que el navegador empiece a cargar la portada pronto. */
export default function HomeImagePreloadHead() {
  const priorityUrls = HOME_PAGE_STATIC_IMAGE_URLS.slice(0, 8)
  return (
    <>
      <link rel="preconnect" href="https://marebo.b-cdn.net" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://marebo.b-cdn.net" />
      {priorityUrls.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
    </>
  )
}
