'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminUpdateCollection, adminUploadCollectionHeroImages } from '@/app/admin/collection-actions'
import type { CollectionRecord } from '@/lib/collections'

export default function CollectionHeroEditor({ collection }: { collection: CollectionRecord }) {
  const [leftUrl, setLeftUrl] = useState(collection.hero_image_left)
  const [rightUrl, setRightUrl] = useState(collection.hero_image_right)
  const [isSaving, setIsSaving] = useState(false)

  const uploadSide = async (side: 'left' | 'right', file: File | null) => {
    if (!file) return
    const formData = new FormData()
    formData.append('images', file)
    const res = await adminUploadCollectionHeroImages(formData)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    const url = res.urls[0]
    if (!url) return
    if (side === 'left') setLeftUrl(url)
    else setRightUrl(url)
  }

  const save = async () => {
    setIsSaving(true)
    try {
      const res = await adminUpdateCollection(collection.slug, {
        hero_image_left: leftUrl,
        hero_image_right: rightUrl,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Portada actualizada')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="border border-neutral-200 bg-white p-5 space-y-4">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">Portada de colección</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['left', 'right'] as const).map((side) => {
          const url = side === 'left' ? leftUrl : rightUrl
          return (
            <div key={side} className="space-y-2">
              <p className="text-xs text-neutral-600">{side === 'left' ? 'Hero izquierda' : 'Hero derecha'}</p>
              {url ? (
                <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden bg-neutral-100">
                  <Image src={url} alt="" fill unoptimized className="object-cover" />
                  <button
                    type="button"
                    onClick={() => (side === 'left' ? setLeftUrl(null) : setRightUrl(null))}
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
                Subir
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void uploadSide(side, e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        disabled={isSaving}
        onClick={() => void save()}
        className="border border-neutral-900 px-4 py-2 text-xs uppercase tracking-wider hover:bg-neutral-900 hover:text-white disabled:opacity-50"
      >
        {isSaving ? 'Guardando…' : 'Guardar portada'}
      </button>
    </div>
  )
}
