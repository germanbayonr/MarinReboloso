'use client'

import { useEffect, useRef } from 'react'
import { preloadHomePageImages } from '@/lib/preload-home-images'

/** Precarga imágenes de la home en segundo plano al entrar. */
export function HomePreloadBoot() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void preloadHomePageImages()
  }, [])
  return null
}
