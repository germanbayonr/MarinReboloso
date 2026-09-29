'use client'

import { useState } from 'react'
import { normalizeProductImageUrl, resolveAdminPanelImageUrl } from '@/lib/image-delivery'
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
  const safe = resolveAdminPanelImageUrl(String(src ?? ''))
  const [failed, setFailed] = useState(false)

  if (!safe) {
    return (
      <div
        className={cn('flex items-center justify-center bg-neutral-100 text-[10px] text-neutral-400', className)}
        style={{ width, height }}
        aria-hidden
      >
        —
      </div>
    )
  }

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-neutral-100 px-1 text-center text-[9px] leading-tight text-neutral-500',
          className,
        )}
        style={{ width, height }}
        title={safe}
      >
        Sin preview
      </div>
    )
  }

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
      onError={() => setFailed(true)}
    />
  )
}

export { resolveAdminPanelImageUrl, normalizeProductImageUrl }
