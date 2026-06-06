'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { adminUpdateCollection } from '@/app/admin/collection-actions'
import type { CollectionRecord } from '@/lib/collections'

export default function CollectionVisibilityEditor({
  collection,
  maxHomepageOrder,
}: {
  collection: CollectionRecord
  maxHomepageOrder: number
}) {
  const [homepageOrder, setHomepageOrder] = useState(String(collection.homepage_order))
  const [visibleOnHomepage, setVisibleOnHomepage] = useState(collection.visible_on_homepage)
  const [visibleOnSite, setVisibleOnSite] = useState(collection.visible_on_site)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const save = async () => {
    const order = Math.max(1, Math.floor(Number(homepageOrder) || 1))
    setIsSaving(true)
    try {
      const res = await adminUpdateCollection(collection.slug, {
        homepage_order: order,
        visible_on_homepage: visibleOnHomepage,
        visible_on_site: visibleOnSite,
        is_active: visibleOnSite,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Visibilidad y orden guardados')
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="border border-neutral-200 bg-white p-5 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Portada y visibilidad</p>
        <p className="text-xs text-neutral-500 mt-1">
          Orden 1 = hero principal (dos columnas). Orden 2, 3… = banners de colección en la home.
        </p>
      </div>

      <div className="space-y-1 max-w-xs">
        <label className="text-[10px] uppercase tracking-wider text-neutral-500">Orden en portada</label>
        <input
          type="number"
          min={1}
          max={Math.max(maxHomepageOrder, 99)}
          value={homepageOrder}
          onChange={(e) => setHomepageOrder(e.target.value)}
          className="w-full border border-neutral-200 px-3 py-2 text-sm"
        />
        <p className="text-xs text-neutral-400">Valor actual máximo en catálogo: {maxHomepageOrder}</p>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-4">
        <div>
          <p className="text-sm text-neutral-900">Visible en portada</p>
          <p className="text-xs text-neutral-500">Hero y banners de la página de inicio</p>
        </div>
        <Switch checked={visibleOnHomepage} onCheckedChange={setVisibleOnHomepage} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-900">Visible en toda la web</p>
          <p className="text-xs text-neutral-500">
            Si está desactivado, la colección y sus productos no aparecen en tienda, catálogo ni menú
          </p>
        </div>
        <Switch checked={visibleOnSite} onCheckedChange={setVisibleOnSite} />
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={() => void save()}
        className="border border-neutral-900 px-4 py-2 text-xs uppercase tracking-wider hover:bg-neutral-900 hover:text-white disabled:opacity-50"
      >
        {isSaving ? 'Guardando…' : 'Guardar visibilidad'}
      </button>
    </div>
  )
}
