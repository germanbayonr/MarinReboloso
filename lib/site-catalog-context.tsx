'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AdminProduct } from '@/lib/admin/types'
import type { SiteCatalogSnapshot } from '@/lib/catalog-snapshot'
import { readSiteCatalogCache, writeSiteCatalogCache, clearSiteCatalogCache } from '@/lib/catalog-client-cache'
import { CATALOG_CHANGED_EVENT } from '@/lib/catalog-events'
import { preloadImageUrls } from '@/lib/preload-images'

interface SiteCatalogContextValue {
  ready: boolean
  loading: boolean
  fromFallback: boolean
  products: AdminProduct[]
  hiddenCollectionSlugs: Set<string>
  imageUrls: string[]
  imagesPreloaded: boolean
  refresh: () => Promise<void>
}

const SiteCatalogContext = createContext<SiteCatalogContextValue | null>(null)

export function SiteCatalogProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SiteCatalogSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [imagesPreloaded, setImagesPreloaded] = useState(false)
  const preloadStarted = useRef(false)
  const fetchStarted = useRef(false)

  const applySnapshot = useCallback((next: SiteCatalogSnapshot) => {
    setSnapshot(next)
    writeSiteCatalogCache(next)
  }, [])

  const preloadImages = useCallback(async (urls: string[]) => {
    if (preloadStarted.current || urls.length === 0) return
    preloadStarted.current = true
    await preloadImageUrls(urls, { concurrency: 6 })
    setImagesPreloaded(true)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cached = readSiteCatalogCache()
      if (cached) {
        applySnapshot(cached)
        setLoading(false)
        void preloadImages(cached.imageUrls)
        return
      }

      const res = await fetch('/api/catalog/snapshot', { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudo cargar el catálogo')
      const data = (await res.json()) as SiteCatalogSnapshot
      applySnapshot(data)
      void preloadImages(data.imageUrls)
    } catch {
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }, [applySnapshot, preloadImages])

  useEffect(() => {
    if (fetchStarted.current) return
    fetchStarted.current = true
    void load()
  }, [load])

  useEffect(() => {
    function onCatalogChanged() {
      clearSiteCatalogCache()
      preloadStarted.current = false
      setImagesPreloaded(false)
      void load()
    }
    window.addEventListener(CATALOG_CHANGED_EVENT, onCatalogChanged)
    return () => window.removeEventListener(CATALOG_CHANGED_EVENT, onCatalogChanged)
  }, [load])

  const value = useMemo<SiteCatalogContextValue>(
    () => ({
      ready: Boolean(snapshot),
      loading,
      fromFallback: snapshot?.fromFallback ?? false,
      products: snapshot?.products ?? [],
      hiddenCollectionSlugs: new Set(snapshot?.hiddenCollectionSlugs ?? []),
      imageUrls: snapshot?.imageUrls ?? [],
      imagesPreloaded,
      refresh: load,
    }),
    [snapshot, loading, imagesPreloaded, load],
  )

  return <SiteCatalogContext.Provider value={value}>{children}</SiteCatalogContext.Provider>
}

export function useSiteCatalog(): SiteCatalogContextValue {
  const ctx = useContext(SiteCatalogContext)
  if (!ctx) {
    throw new Error('useSiteCatalog debe usarse dentro de SiteCatalogProvider')
  }
  return ctx
}

/** Versión segura para componentes opcionales fuera del provider. */
export function useSiteCatalogOptional(): SiteCatalogContextValue | null {
  return useContext(SiteCatalogContext)
}
