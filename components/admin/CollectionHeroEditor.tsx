'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminUpdateCollection, adminUploadCollectionHeroImages } from '@/app/admin/collection-actions'
import type { CollectionRecord } from '@/lib/collections'

export default function CollectionHeroEditor({ collection }: { collection: CollectionRecord }) {
  const isHeroMain = collection.homepage_order === 1
  const [leftUrl, setLeftUrl] = useState(collection.hero_image_left)
  const [rightUrl, setRightUrl] = useState(isHeroMain ? collection.hero_image_right : null)
  const [isUploading, setIsUploading] = useState(false)

  const persistImages = async (nextLeft: string | null, nextRight: string | null) => {
    const res = await adminUpdateCollection(collection.slug, {
      hero_image_left: nextLeft,
      hero_image_right: isHeroMain ? nextRight : null,
    })
    if (!res.ok) {
      toast.error(res.error)
      return false
    }
    toast.success('Portada sincronizada con Supabase')
    return true
  }

  const uploadImage = async (file: File | null): Promise<string | null> => {
    if (!file) return null
    const formData = new FormData()
    formData.append('images', file)
    const res = await adminUploadCollectionHeroImages(formData)
    if (!res.ok) {
      toast.error(res.error)
      return null
    }
    return res.urls[0] ?? null
  }

  const uploadSide = async (side: 'left' | 'right', file: File | null) => {
    if (!file) return
    setIsUploading(true)
    try {
      const url = await uploadImage(file)
      if (!url) return
      const nextLeft = side === 'left' ? url : leftUrl
      const nextRight = side === 'right' ? url : rightUrl
      if (side === 'left') setLeftUrl(url)
      else setRightUrl(url)
      await persistImages(nextLeft, nextRight)
    } finally {
      setIsUploading(false)
    }
  }

  const uploadPortada = async (file: File | null) => {
    if (!file) return
    setIsUploading(true)
    try {
      const url = await uploadImage(file)
      if (!url) return
      setLeftUrl(url)
      await persistImages(url, null)
    } finally {
      setIsUploading(false)
    }
  }

  const clearSide = async (side: 'left' | 'right') => {
    const nextLeft = side === 'left' ? null : leftUrl
    const nextRight = side === 'right' ? null : rightUrl
    if (side === 'left') setLeftUrl(null)
    else setRightUrl(null)
    await persistImages(nextLeft, nextRight)
  }

  const clearPortada = async () => {
    setLeftUrl(null)
    await persistImages(null, null)
  }

  return (
    <div className="border border-neutral-200 bg-white p-5 space-y-4">
      {isHeroMain ? (
        <>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Hero principal (orden 1)</p>
          <p className="text-xs text-neutral-500">
            Al subir, la imagen se guarda al instante en Supabase Storage y en la colección
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['left', 'right'] as const).map((side) => {
              const url = side === 'left' ? leftUrl : rightUrl
              return (
                <div key={side} className="space-y-2">
                  <p className="text-xs text-neutral-600">
                    {side === 'left' ? 'Imagen izquierda' : 'Imagen derecha'}
                  </p>
                  {url ? (
                    <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden bg-neutral-100">
                      <Image src={url} alt="" fill unoptimized className="object-cover" />
                      <button
                        type="button"
                        onClick={() => void clearSide(side)}
                        disabled={isUploading}
                        className="absolute right-2 top-2 bg-white/90 p-1"
                        aria-label="Quitar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">Sin imagen</p>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 border border-neutral-200 px-3 py-2 text-xs hover:border-neutral-400">
                    <Upload className="h-3.5 w-3.5" />
                    {isUploading ? 'Subiendo…' : 'Subir'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => void uploadSide(side, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Imagen de portada</p>
          <p className="text-xs text-neutral-500">
            Al subir, la imagen se guarda al instante en Supabase Storage y en la colección
          </p>
          <div className="space-y-2 max-w-xs">
            {leftUrl ? (
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                <Image src={leftUrl} alt="" fill unoptimized className="object-cover" />
                <button
                  type="button"
                  onClick={() => void clearPortada()}
                  disabled={isUploading}
                  className="absolute right-2 top-2 bg-white/90 p-1"
                  aria-label="Quitar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">Sin imagen</p>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 border border-neutral-200 px-3 py-2 text-xs hover:border-neutral-400">
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? 'Subiendo…' : 'Subir imagen de portada'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => void uploadPortada(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </>
      )}
    </div>
  )
}
