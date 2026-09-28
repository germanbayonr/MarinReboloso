import { normalizeProductImageUrl } from '@/lib/image-delivery'
import { cn } from '@/lib/utils'

/** Miniaturas en panel admin: no usa next/image (evita 500 si la URL no está en remotePatterns). */
export function AdminProductImage({
  src,
  width,
  height,
  className,
  alt = '',
}: {
  src: string | null | undefined
  width?: number
  height?: number
  className?: string
  alt?: string
}) {
  const safe = normalizeProductImageUrl(String(src ?? ''))
  if (!safe) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safe}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={cn(className)}
    />
  )
}
