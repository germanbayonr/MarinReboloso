'use client'

import { useEffect, useRef } from 'react'
import { preloadHomePageImages } from '@/lib/preload-home-images'
import { PRELOADER_STORAGE_KEY } from '@/lib/preloader-events'

/** Si el preloader ya se vio en la sesión, precarga la home en segundo plano. */
export function HomePreloadBoot() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    try {
      if (sessionStorage.getItem(PRELOADER_STORAGE_KEY) == null) return
    } catch {
      return
    }
    ran.current = true
    void preloadHomePageImages()
  }, [])
  return null
}
