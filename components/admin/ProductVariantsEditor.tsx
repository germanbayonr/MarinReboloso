'use client'

import { useCallback, useState } from 'react'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import { AdminProductImage } from '@/components/admin/AdminProductImage'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { uploadProductImagesToSupabase } from '@/lib/admin/upload-product-images-client'
import type { ProductVariantItem, ProductVariantsData } from '@/lib/product-variants'
import { emptyProductVariants, variantItemImageUrls } from '@/lib/product-variants'

function newVariantItem(partial?: Partial<ProductVariantItem>): ProductVariantItem {
  const urls = partial ? variantItemImageUrls(partial as ProductVariantItem) : []
  return {
    id: partial?.id ?? crypto.randomUUID(),
    color: partial?.color ?? null,
    size: partial?.size ?? null,
    image_url: urls[0] ?? partial?.image_url ?? '',
    image_urls: urls.length > 1 ? urls : urls.length === 1 ? urls : partial?.image_urls,
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
      items: variants.items.map((item) => {
        if (item.id !== id) return item
        const merged = { ...item, ...patch }
        const urls = variantItemImageUrls(merged)
        return {
          ...merged,
          image_url: urls[0] ?? '',
          image_urls: urls.length > 0 ? urls : undefined,
        }
      }),
    })
  }

  const removeItem = (id: string) => {
    onVariantsChange({ ...variants, items: variants.items.filter((item) => item.id !== id) })
  }

  const addItem = () => {
    onVariantsChange({ ...variants, items: [...variants.items, newVariantItem()] })
  }

  const uploadVariantImages = async (itemId: string, files: FileList | File[]) => {
    const list = Array.from(files)
    if (!list.length) return
    setUploadingId(itemId)
    try {
      const res = await uploadProductImagesToSupabase(list)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const newUrls = res.urls.filter(Boolean)
      if (!newUrls.length) return
      const item = variants.items.find((i) => i.id === itemId)
      const existing = item ? variantItemImageUrls(item) : []
      const combined = [...existing, ...newUrls]
      updateItem(itemId, {
        image_url: combined[0] ?? '',
        image_urls: combined.length ? combined : undefined,
      })
      toast.success(newUrls.length > 1 ? 'Imágenes subidas' : 'Imagen subida')
    } finally {
      setUploadingId(null)
    }
  }

  const removeVariantImage = (itemId: string, url: string) => {
    const item = variants.items.find((i) => i.id === itemId)
    if (!item) return
    const next = variantItemImageUrls(item).filter((u) => u !== url)
    updateItem(itemId, {
      image_url: next[0] ?? '',
      image_urls: next.length ? next : undefined,
    })
  }

  return (
    <div className="space-y-4 border border-neutral-200 bg-neutral-50/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Variantes</p>
          <p className="text-xs text-neutral-500">
            Colores, tallas e imágenes por variante. En pedidos se muestra «Color · Talla».
          </p>
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
              <p className="text-xs text-neutral-500">Añade al menos una variante con una imagen.</p>
            ) : null}

            {variants.items.map((item) => {
              const urls = variantItemImageUrls(item)
              const isUploading = uploadingId === item.id
              return (
                <div key={item.id} className="space-y-3 border border-neutral-200 bg-white p-3">
                  <div className="flex flex-wrap gap-2">
                    {urls.map((url) => (
                      <div key={url} className="relative h-20 w-20 shrink-0 overflow-hidden bg-neutral-100">
                        <AdminProductImage src={url} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(item.id, url)}
                          className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                          aria-label="Quitar imagen"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 hover:border-neutral-400">
                      <Upload className="h-4 w-4" />
                      <span className="text-[10px]">{isUploading ? '…' : 'Subir'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const files = e.target.files
                          if (files?.length) void uploadVariantImages(item.id, files)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
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
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="self-end p-2 text-neutral-400 hover:text-red-600"
                      aria-label="Eliminar variante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {urls.length === 0 ? (
                    <p className="text-xs text-amber-700">Sube al menos una imagen para esta variante.</p>
                  ) : null}
                </div>
              )
            })}
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
