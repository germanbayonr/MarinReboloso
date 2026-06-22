'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { uploadProductImagesToSupabase } from '@/lib/admin/upload-product-images-client'
import type { ProductVariantItem, ProductVariantsData } from '@/lib/product-variants'
import { emptyProductVariants } from '@/lib/product-variants'

function newVariantItem(partial?: Partial<ProductVariantItem>): ProductVariantItem {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    color: partial?.color ?? null,
    size: partial?.size ?? null,
    image_url: partial?.image_url ?? '',
    in_stock: partial?.in_stock ?? true,
  }
}

function parseListInput(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function ProductVariantsEditor({
  hasVariants,
  variants,
  onHasVariantsChange,
  onVariantsChange,
}: {
  hasVariants: boolean
  variants: ProductVariantsData
  onHasVariantsChange: (value: boolean) => void
  onVariantsChange: (value: ProductVariantsData) => void
}) {
  const [colorsText, setColorsText] = useState(variants.colors.join(', '))
  const [sizesText, setSizesText] = useState(variants.sizes.join(', '))
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const syncLists = useCallback(
    (nextColors: string[], nextSizes: string[]) => {
      onVariantsChange({ ...variants, colors: nextColors, sizes: nextSizes })
    },
    [onVariantsChange, variants],
  )

  const updateItem = (id: string, patch: Partial<ProductVariantItem>) => {
    onVariantsChange({
      ...variants,
      items: variants.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })
  }

  const removeItem = (id: string) => {
    onVariantsChange({ ...variants, items: variants.items.filter((item) => item.id !== id) })
  }

  const addItem = () => {
    onVariantsChange({ ...variants, items: [...variants.items, newVariantItem()] })
  }

  const uploadVariantImage = async (itemId: string, file: File) => {
    setUploadingId(itemId)
    try {
      const res = await uploadProductImagesToSupabase([file])
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const url = res.urls[0]
      if (!url) return
      updateItem(itemId, { image_url: url })
      toast.success('Imagen de variante subida')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="space-y-4 border border-neutral-200 bg-neutral-50/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Variantes</p>
          <p className="text-xs text-neutral-500">Colores, tallas e imagen específica por variante</p>
        </div>
        <Switch
          checked={hasVariants}
          onCheckedChange={(checked) => {
            onHasVariantsChange(checked)
            if (!checked) onVariantsChange(emptyProductVariants())
          }}
        />
      </div>

      {hasVariants ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-neutral-500">Colores (separados por coma)</label>
              <input
                type="text"
                value={colorsText}
                onChange={(e) => setColorsText(e.target.value)}
                onBlur={() => syncLists(parseListInput(colorsText), variants.sizes)}
                placeholder="Carmín, Turquesa, Marfil"
                className="w-full border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-neutral-500">Tallas (separadas por coma)</label>
              <input
                type="text"
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                onBlur={() => syncLists(variants.colors, parseListInput(sizesText))}
                placeholder="Grande, Pequeño"
                className="w-full border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-700">Combinaciones con imagen</p>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-neutral-600 hover:text-neutral-900"
              >
                <Plus className="h-3.5 w-3.5" /> Añadir variante
              </button>
            </div>

            {variants.items.length === 0 ? (
              <p className="text-xs text-neutral-500">Añade al menos una variante con su imagen.</p>
            ) : null}

            {variants.items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[88px_1fr_auto] gap-3 border border-neutral-200 bg-white p-3">
                <div className="relative aspect-square w-[88px] overflow-hidden bg-neutral-100">
                  {item.image_url ? (
                    <Image src={item.image_url} alt="" fill unoptimized className="object-cover" />
                  ) : (
                    <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-1 text-neutral-400">
                      <Upload className="h-4 w-4" />
                      <span className="text-[10px]">{uploadingId === item.id ? '…' : 'Subir'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingId === item.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) void uploadVariantImage(item.id, file)
                        }}
                      />
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-neutral-500">Color</label>
                    <input
                      type="text"
                      list="variant-colors-list"
                      value={item.color ?? ''}
                      onChange={(e) => updateItem(item.id, { color: e.target.value.trim() || null })}
                      className="w-full border border-neutral-200 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-neutral-500">Talla</label>
                    <input
                      type="text"
                      list="variant-sizes-list"
                      value={item.size ?? ''}
                      onChange={(e) => updateItem(item.id, { size: e.target.value.trim() || null })}
                      className="w-full border border-neutral-200 px-2 py-1.5 text-sm"
                    />
                  </div>
                  {item.image_url ? (
                    <label className="sm:col-span-2 text-xs text-neutral-500 underline cursor-pointer">
                      Cambiar imagen
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingId === item.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) void uploadVariantImage(item.id, file)
                        }}
                      />
                    </label>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="self-start p-2 text-neutral-400 hover:text-red-600"
                  aria-label="Eliminar variante"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <datalist id="variant-colors-list">
            {variants.colors.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="variant-sizes-list">
            {variants.sizes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      ) : null}
    </div>
  )
}
