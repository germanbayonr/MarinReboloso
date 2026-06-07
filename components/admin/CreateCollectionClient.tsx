'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { adminCreateCollectionWithImages, adminUploadCollectionHeroImages } from '@/app/admin/collection-actions'
import { slugifyCollectionLabel } from '@/lib/collection-slug'
import type { AdminProduct } from '@/lib/admin/types'

export default function CreateCollectionClient({
  allProducts,
  defaultHomepageOrder,
}: {
  allProducts: AdminProduct[]
  defaultHomepageOrder: number
}) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [heroLeftUrl, setHeroLeftUrl] = useState<string | null>(null)
  const [heroRightUrl, setHeroRightUrl] = useState<string | null>(null)
  const [heroUploading, setHeroUploading] = useState<'left' | 'right' | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [homepageOrder, setHomepageOrder] = useState(String(defaultHomepageOrder))
  const [visibleOnHomepage, setVisibleOnHomepage] = useState(true)
  const [visibleOnSite, setVisibleOnSite] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const autoSlug = useMemo(() => slugifyCollectionLabel(label), [label])
  const orderNum = Math.max(1, Math.floor(Number(homepageOrder) || 1))
  const isHeroMain = orderNum === 1

  useEffect(() => {
    if (!isHeroMain) setHeroRightUrl(null)
  }, [isHeroMain])

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim()
    if (!q) return allProducts
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.collection ?? '').toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    )
  }, [allProducts, productSearch])

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const setHeroFile = async (side: 'left' | 'right', file: File | null) => {
    if (!file) {
      if (side === 'left') setHeroLeftUrl(null)
      else setHeroRightUrl(null)
      return
    }
    setHeroUploading(side)
    try {
      const formData = new FormData()
      formData.append('images', file)
      const res = await adminUploadCollectionHeroImages(formData)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const url = res.urls[0] ?? null
      if (!url) return
      if (side === 'left') setHeroLeftUrl(url)
      else setHeroRightUrl(url)
      toast.success('Imagen subida a Supabase')
    } finally {
      setHeroUploading(null)
    }
  }

  const handleSubmit = async () => {
    const trimmedLabel = label.trim()
    if (!trimmedLabel) {
      toast.error('Indica el nombre de la colección')
      return
    }
    const finalSlug = (slug.trim() || autoSlug).toLowerCase()
    if (!finalSlug) {
      toast.error('Slug no válido')
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.set('label', trimmedLabel)
      formData.set('slug', finalSlug)
      formData.set('description', description.trim())
      formData.set('product_ids', selectedProductIds.join(','))
      formData.set('homepage_order', homepageOrder)
      formData.set('visible_on_homepage', String(visibleOnHomepage))
      formData.set('visible_on_site', String(visibleOnSite))
      if (heroLeftUrl) formData.set('hero_image_left', heroLeftUrl)
      if (isHeroMain && heroRightUrl) formData.set('hero_image_right', heroRightUrl)

      const res = await adminCreateCollectionWithImages(formData)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Colección creada')
      router.push(`/admin/colecciones/${res.collection.slug}`)
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl tracking-wide text-neutral-900">Nueva colección</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Se guardará en Supabase y aparecerá en la tienda</p>
        </div>
        <Link href="/admin/colecciones" className="text-sm text-neutral-500 underline hover:text-neutral-900">
          Volver
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 border border-neutral-200 bg-white p-5">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Nombre</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Ej. Primavera"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Slug (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={autoSlug || 'mi-coleccion'}
              className="w-full border border-neutral-200 px-3 py-2 text-sm font-mono"
            />
            <p className="text-xs text-neutral-500">/coleccion/{slug.trim() || autoSlug || '…'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Orden en portada</label>
            <input
              type="number"
              min={1}
              value={homepageOrder}
              onChange={(e) => setHomepageOrder(e.target.value)}
              className="w-full border border-neutral-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-neutral-500">1 = hero principal (dos columnas). 2, 3… = banners debajo.</p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <div>
              <p className="text-sm text-neutral-800">Visible en portada</p>
            </div>
            <Switch checked={visibleOnHomepage} onCheckedChange={setVisibleOnHomepage} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-800">Visible en toda la web</p>
            </div>
            <Switch checked={visibleOnSite} onCheckedChange={setVisibleOnSite} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Descripción (opcional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-4 border border-neutral-200 bg-white p-5">
          {isHeroMain ? (
            <>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Hero principal (orden 1)</p>
              <p className="text-xs text-neutral-500">Dos imágenes para la cabecera en dos columnas de la portada</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['left', 'right'] as const).map((side) => {
                  const preview = side === 'left' ? heroLeftUrl : heroRightUrl
                  const isUploading = heroUploading === side
                  return (
                    <div key={side} className="space-y-2">
                      <p className="text-xs text-neutral-600">
                        {side === 'left' ? 'Imagen izquierda' : 'Imagen derecha'}
                      </p>
                      {preview ? (
                        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                          <Image src={preview} alt="" fill unoptimized className="object-cover" />
                          <button
                            type="button"
                            onClick={() => setHeroFile(side, null)}
                            disabled={isUploading}
                            className="absolute right-2 top-2 bg-white/90 p-1 disabled:opacity-50"
                            aria-label="Quitar imagen"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-neutral-300 py-10 text-neutral-500 hover:border-neutral-400 ${isUploading ? 'pointer-events-none opacity-60' : ''}`}>
                          <Upload className="h-5 w-5" />
                          <span className="text-xs">{isUploading ? 'Subiendo…' : 'Subir imagen'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => void setHeroFile(side, e.target.files?.[0] ?? null)}
                          />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Imagen de portada</p>
              <p className="text-xs text-neutral-500">Una sola imagen para el banner de esta colección en la home</p>
              <div className="space-y-2 max-w-sm">
                {heroLeftUrl ? (
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                    <Image src={heroLeftUrl} alt="" fill unoptimized className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setHeroFile('left', null)}
                      disabled={heroUploading === 'left'}
                      className="absolute right-2 top-2 bg-white/90 p-1 disabled:opacity-50"
                      aria-label="Quitar imagen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-neutral-300 py-10 text-neutral-500 hover:border-neutral-400 ${heroUploading === 'left' ? 'pointer-events-none opacity-60' : ''}`}>
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">{heroUploading === 'left' ? 'Subiendo…' : 'Subir imagen de portada'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={heroUploading === 'left'}
                      onChange={(e) => void setHeroFile('left', e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border border-neutral-200 bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Productos de la colección</p>
          <span className="text-xs text-neutral-500">{selectedProductIds.length} seleccionados</span>
        </div>
        <input
          type="search"
          placeholder="Buscar producto…"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="w-full max-w-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <div className="max-h-72 overflow-y-auto border border-neutral-100 divide-y">
          {filteredProducts.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={selectedProductIds.includes(p.id)}
                onChange={() => toggleProduct(p.id)}
                className="h-3.5 w-3.5"
              />
              <span className="text-sm text-neutral-800">{p.name}</span>
              {p.collection ? (
                <span className="ml-auto text-xs text-neutral-400">{p.collection}</span>
              ) : null}
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={() => void handleSubmit()}
        className="bg-neutral-900 px-6 py-3 text-xs uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {isSaving ? 'Creando…' : 'Crear colección'}
      </button>
    </div>
  )
}
