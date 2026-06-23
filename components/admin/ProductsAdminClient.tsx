'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, CheckCircle, Download, Pencil, PlusCircle, Search, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import AdminDataTable from '@/components/admin/AdminDataTable'
import {
  adminSyncProductsWithStripe,
  adminSetProductCatalogVisible,
  adminSetProductStock,
  deleteProduct,
  deleteProducts,
  updateProduct,
} from '@/app/admin/actions'
import { uploadProductImagesToSupabase } from '@/lib/admin/upload-product-images-client'
import { notifySiteCatalogChanged } from '@/lib/catalog-events'
import { computeFinalPrice, hasActiveDiscount } from '@/lib/pricing'
import { labelForCollectionSlug, PRODUCT_COLLECTION_OPTIONS } from '@/lib/admin/product-collections'
import type { AdminProduct } from '@/lib/admin/types'
import { sortProductsByCreatedAtDesc } from '@/lib/admin/sort-products'
import ProductVariantsEditor from '@/components/admin/ProductVariantsEditor'
import { emptyProductVariants, type ProductVariantsData } from '@/lib/product-variants'

const CATEGORIES = ['pendientes', 'mantones', 'accesorios', 'peinecillos', 'broches', 'pulseras', 'collares', 'bolsos']

type DeleteConfirmState = {
  products: AdminProduct[]
} | null

function DeleteProductDialogDescription({ products }: { products: AdminProduct[] }) {
  const preview = products.slice(0, 5)
  const remaining = products.length - preview.length

  return (
    <div className="space-y-3 text-neutral-600">
      <p>
        {products.length === 1 ? (
          <>
            Se eliminará <span className="font-medium text-neutral-900">{products[0].name}</span> de Supabase
            (incluidas las imágenes) y se desactivará en Stripe. Esta acción no se puede deshacer.
          </>
        ) : (
          <>
            Se eliminarán <span className="font-medium text-neutral-900">{products.length} productos</span> de
            Supabase (incluidas las imágenes) y se desactivarán en Stripe. Esta acción no se puede deshacer.
          </>
        )}
      </p>
      {products.length > 1 ? (
        <ul className="list-disc space-y-1 pl-4 text-sm">
          {preview.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
          {remaining > 0 ? <li>…y {remaining} más</li> : null}
        </ul>
      ) : null}
    </div>
  )
}

export function ProductEditModal({
  product,
  collectionOptions = PRODUCT_COLLECTION_OPTIONS,
  defaultCollectionSlug,
  onClose,
  onSaved,
}: {
  product: AdminProduct
  collectionOptions?: { slug: string; label: string }[]
  /** Si se edita desde una colección, fuerza ese slug al guardar si el campo queda vacío. */
  defaultCollectionSlug?: string
  onClose: () => void
  onSaved: (p: AdminProduct) => void
}) {
  const initialImages =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : []
  const origBase = product.original_price ?? product.price
  const initialCollection =
    product.collection?.trim() ||
    defaultCollectionSlug?.trim() ||
    ''
  const [form, setForm] = useState({
    name: product.name,
    description: product.description ?? '',
    original_price: String(origBase),
    discount_percent: String(product.discount_percent ?? 0),
    category: product.category ?? 'accesorios',
    collection: initialCollection,
    image_url: product.image_url ?? '',
    is_new_arrival: product.is_new_arrival,
    in_stock: product.in_stock,
  })
  const [images, setImages] = useState<string[]>(initialImages)
  const [hasVariants, setHasVariants] = useState(product.has_variants)
  const [variants, setVariants] = useState<ProductVariantsData>(
    product.has_variants ? product.variants : emptyProductVariants(),
  )
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const collectionUnknownInList =
    !!form.collection && !collectionOptions.some((o) => o.slug === form.collection)
  const [saved, setSaved] = useState(false)

  const o = Number(form.original_price) || 0
  const d = Math.min(100, Math.max(0, Number(form.discount_percent) || 0))
  const finalPreview = computeFinalPrice(o, d)

  const buildProductInput = (imageList: string[]) => {
    const cleanedImages = imageList.map((url) => url.trim()).filter(Boolean)
    const variantUrls = variants.items.map((i) => i.image_url.trim()).filter(Boolean)
    const useVariants = hasVariants && variantUrls.length > 0
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      collection: form.collection.trim() || defaultCollectionSlug?.trim() || null,
      image_url: useVariants ? variantUrls[0] : cleanedImages[0] ?? (form.image_url.trim() || null),
      image_urls: useVariants ? variantUrls : cleanedImages,
      is_new_arrival: form.is_new_arrival,
      in_stock: form.in_stock,
      original_price: o,
      discount_percent: d,
      has_variants: hasVariants,
      variants: hasVariants ? variants : emptyProductVariants(),
    }
  }

  const syncImagesToSupabase = async (nextImages: string[], successMessage?: string) => {
    const res = await updateProduct(product.id, buildProductInput(nextImages))
    if (!res.ok) {
      toast.error(res.error)
      return false
    }
    onSaved(res.product)
    notifySiteCatalogChanged()
    if (successMessage) toast.success(successMessage)
    return true
  }

  const handleSave = async () => {
    const cleanedImages = images.map((url) => url.trim()).filter(Boolean)
    const res = await updateProduct(product.id, buildProductInput(cleanedImages))
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    onSaved(res.product)
    notifySiteCatalogChanged()
    setSaved(true)
    toast.success('Producto actualizado')
    setTimeout(onClose, 600)
  }

  const handleAppendImageUrl = async () => {
    const trimmed = newImageUrl.trim()
    if (!trimmed) return
    if (images.includes(trimmed)) {
      toast.error('Esa imagen ya está en la galería')
      return
    }
    const next = [...images, trimmed]
    setImages(next)
    setNewImageUrl('')
    await syncImagesToSupabase(next, 'Imagen añadida en Supabase')
  }

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === images.length - 1)) return
    const next = [...images]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const current = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = current
    setImages(next)
    await syncImagesToSupabase(next)
  }

  const removeImage = async (index: number) => {
    const next = images.filter((_, i) => i !== index)
    setImages(next)
    await syncImagesToSupabase(next, 'Imagen eliminada')
  }

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadingImages(true)
    try {
      const res = await uploadProductImagesToSupabase(Array.from(files))
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const next = [...images, ...res.urls]
      setImages(next)
      await syncImagesToSupabase(next, `${res.urls.length} imagen(es) subida(s) a Supabase`)
    } finally {
      setUploadingImages(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg border border-neutral-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h2 className="font-serif text-lg tracking-wide text-neutral-900">Editar producto</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-900" aria-label="Cerrar">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Descripción</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full resize-none border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-neutral-500">Precio original (€)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.original_price}
                onChange={(e) => setForm((f) => ({ ...f, original_price: e.target.value }))}
                className="w-full border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-neutral-500">Descuento (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="1"
                value={form.discount_percent}
                onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                className="w-full border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-sm text-neutral-700">
            Precio final: <span className="font-medium">{finalPreview.toFixed(2)}€</span>
          </p>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Colección</label>
            <select
              value={form.collection}
              onChange={(e) => setForm((f) => ({ ...f, collection: e.target.value }))}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            >
              <option value="">Sin colección</option>
              {collectionUnknownInList ? (
                <option value={form.collection}>{form.collection} (en BD)</option>
              ) : null}
              {collectionOptions.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Imagen (URL)</label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            />
          </div>
          <ProductVariantsEditor
            hasVariants={hasVariants}
            variants={variants}
            onHasVariantsChange={setHasVariants}
            onVariantsChange={setVariants}
          />
          {!hasVariants ? (
          <div className="space-y-2 border-t border-neutral-100 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Galería de fotos</p>
              <label className="inline-flex cursor-pointer items-center gap-1 border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:border-neutral-400">
                <Upload className="h-3.5 w-3.5" />
                {uploadingImages ? 'Subiendo…' : 'Subir'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingImages}
                  className="hidden"
                  onChange={(e) => void handleUploadImages(e.target.files)}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://.../imagen.webp"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAppendImageUrl}
                className="border border-neutral-200 px-3 py-2 text-xs uppercase tracking-wider text-neutral-700 hover:border-neutral-400"
              >
                Añadir
              </button>
            </div>
            {images.length === 0 ? (
              <p className="text-xs text-neutral-500">No hay fotos en la galería.</p>
            ) : (
              <div className="space-y-2">
                {images.map((image, index) => (
                  <div key={`${image}-${index}`} className="flex items-center gap-2 border border-neutral-200 px-2 py-1.5">
                    <Image
                      src={image}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized
                      className="h-11 w-11 shrink-0 bg-neutral-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-neutral-600">{image}</p>
                      <p className="text-[10px] text-neutral-500">{index === 0 ? 'Portada principal' : `Imagen ${index + 1}`}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={image}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-neutral-500 hover:text-neutral-900"
                        aria-label="Descargar imagen"
                        title="Descargar imagen"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-neutral-500 disabled:opacity-30"
                        aria-label="Subir posición"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'down')}
                        disabled={index === images.length - 1}
                        className="p-1 text-neutral-500 disabled:opacity-30"
                        aria-label="Bajar posición"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1 text-neutral-500 hover:text-red-600"
                        aria-label="Eliminar imagen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          ) : null}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_new_arrival}
              onChange={(e) => setForm((f) => ({ ...f, is_new_arrival: e.target.checked }))}
              className="h-3.5 w-3.5 accent-neutral-900"
            />
            <span className="text-sm text-neutral-600">Novedad</span>
          </label>
          <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
            <div>
              <p className="text-sm text-neutral-900">Disponible</p>
              <p className="text-xs text-neutral-500">Sin stock = agotado en tienda</p>
            </div>
            <Switch checked={form.in_stock} onCheckedChange={(v) => setForm((f) => ({ ...f, in_stock: v }))} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3">
          {saved ? (
            <span className="flex items-center gap-1 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              Guardado
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-400"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              className="bg-neutral-900 px-4 py-2 text-sm uppercase tracking-wider text-white hover:bg-neutral-800"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsAdminClient({
  initialProducts,
  variant = 'full',
  collectionLabel,
  collectionSlug,
  collectionOptions = PRODUCT_COLLECTION_OPTIONS,
}: {
  initialProducts: AdminProduct[]
  variant?: 'full' | 'collection'
  collectionLabel?: string
  /** Slug de la colección actual (vista colección → nuevo producto enlazado) */
  collectionSlug?: string
  collectionOptions?: { slug: string; label: string }[]
}) {
  const [products, setProducts] = useState(initialProducts ?? [])
  const [search, setSearch] = useState('')
  const [isSyncingWithStripe, setIsSyncingWithStripe] = useState(false)
  const [syncFailures, setSyncFailures] = useState<Array<{ name: string; reason: string }>>([])
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const sortedProducts = useMemo(() => sortProductsByCreatedAtDesc(products), [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return sortedProducts
    return sortedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.collection ?? '').toLowerCase().includes(q) ||
        labelForCollectionSlug(p.collection, collectionOptions).toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    )
  }, [sortedProducts, search, collectionOptions])

  const isCollectionView = variant === 'collection'
  const selectedCount = selectedIds.size
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id))
  const someFilteredSelected = filtered.some((p) => selectedIds.has(p.id))

  function toggleProductSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) filtered.forEach((p) => next.delete(p.id))
      else filtered.forEach((p) => next.add(p.id))
      return next
    })
  }

  const columns = useMemo<ColumnDef<AdminProduct>[]>(
    () => [
      ...(!isCollectionView
        ? [
            {
              id: 'select',
              header: () => (
                <Checkbox
                  checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
                  onCheckedChange={() => toggleSelectAllFiltered()}
                  aria-label="Seleccionar todos los productos visibles"
                />
              ),
              cell: ({ row }: { row: { original: AdminProduct } }) => {
                const p = row.original
                return (
                  <Checkbox
                    checked={selectedIds.has(p.id)}
                    onCheckedChange={() => toggleProductSelection(p.id)}
                    aria-label={`Seleccionar ${p.name}`}
                  />
                )
              },
            } satisfies ColumnDef<AdminProduct>,
          ]
        : []),
      {
        id: 'product',
        header: 'Producto',
        cell: ({ row }) => {
          const p = row.original
          const src = typeof p.image_url === 'string' ? p.image_url.trim() : ''
          return (
            <div className="flex items-center gap-2">
              {src ? (
                <Image
                  src={src}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                  className="h-9 w-9 shrink-0 bg-neutral-100 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-100 text-[10px] uppercase tracking-wider text-neutral-500">
                  Sin foto
                </div>
              )}
              <span className="font-medium text-neutral-900">{p.name}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'category',
        header: 'Categoría',
        cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) ?? '—'}</span>,
      },
      {
        id: 'collection',
        header: 'Colección',
        cell: ({ row }) => (
          <span className="text-neutral-600 text-xs">{labelForCollectionSlug(row.original.collection, collectionOptions)}</span>
        ),
      },
      {
        id: 'pricing',
        header: 'Precios',
        cell: ({ row }) => {
          const p = row.original
          const show = hasActiveDiscount(p.original_price, p.discount_percent)
          return (
            <div className="text-right text-xs">
              {show ? (
                <>
                  <span className="text-neutral-400 line-through">{Number(p.original_price).toFixed(2)}€</span>
                  <span className="ml-1 font-medium text-neutral-900">{p.price.toFixed(2)}€</span>
                  <span className="ml-1 text-neutral-500">(-{p.discount_percent}%)</span>
                </>
              ) : (
                <span className="font-medium">{p.price.toFixed(2)}€</span>
              )}
            </div>
          )
        },
      },
      {
        id: 'stock',
        header: 'Stock',
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={p.in_stock}
                onCheckedChange={async (v) => {
                  const res = await adminSetProductStock(p.id, v)
                  if (!res.ok) {
                    toast.error(res.error)
                    return
                  }
                  setProducts((prev) => prev.map((x) => (x.id === p.id ? res.product : x)))
                  toast.success(v ? 'Disponible' : 'Sin stock')
                }}
              />
              <span className="text-xs text-neutral-500">{p.in_stock ? 'Disponible' : 'Sin stock'}</span>
            </div>
          )
        },
      },
      {
        id: 'catalog',
        header: 'En la web',
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={p.is_active}
                onCheckedChange={async (v) => {
                  const res = await adminSetProductCatalogVisible(p.id, v)
                  if (!res.ok) {
                    toast.error(res.error)
                    return
                  }
                  setProducts((prev) => prev.map((x) => (x.id === p.id ? res.product : x)))
                  toast.success(v ? 'Visible en la tienda' : 'En pausa (no aparece en la web)')
                }}
              />
              <span className="text-xs text-neutral-500">{p.is_active ? 'Visible' : 'Pausa'}</span>
            </div>
          )
        },
      },
      {
        id: 'stripe',
        header: 'Stripe',
        cell: ({ row }) => (
          <span
            className={cn(
              'text-xs px-1.5 py-0.5',
              row.original.stripe_price_id ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-50 text-neutral-500',
            )}
          >
            {row.original.stripe_price_id ? 'OK' : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="p-1.5 text-neutral-500 hover:text-neutral-900"
                aria-label="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm({ products: [p] })}
                className="p-1.5 text-neutral-500 hover:text-red-600"
                aria-label="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        },
      },
    ],
    [allFilteredSelected, collectionOptions, isCollectionView, selectedIds, someFilteredSelected],
  )

  const productsPendingDelete = deleteConfirm?.products ?? []
  const isBulkDelete = productsPendingDelete.length > 1

  async function confirmDeleteProducts() {
    if (productsPendingDelete.length === 0) return
    setIsDeletingProduct(true)
    try {
      if (isBulkDelete) {
        const res = await deleteProducts(productsPendingDelete.map((p) => p.id))
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        const failedIds = new Set(res.failures.map((f) => f.id))
        const deletedIds = productsPendingDelete.map((p) => p.id).filter((id) => !failedIds.has(id))
        if (deletedIds.length > 0) {
          setProducts((prev) => prev.filter((x) => !deletedIds.includes(x.id)))
          setSelectedIds((prev) => {
            const next = new Set(prev)
            deletedIds.forEach((id) => next.delete(id))
            return next
          })
          notifySiteCatalogChanged()
        }
        if (res.failures.length > 0) {
          toast.error(`${res.deletedCount} eliminado(s). ${res.failures.length} error(es).`)
          return
        }
        toast.success(`${res.deletedCount} producto(s) eliminados de Supabase y Stripe`)
      } else {
        const target = productsPendingDelete[0]
        const res = await deleteProduct(target.id)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        setProducts((prev) => prev.filter((x) => x.id !== target.id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(target.id)
          return next
        })
        notifySiteCatalogChanged()
        toast.success('Producto eliminado de Supabase y Stripe')
      }
      setDeleteConfirm(null)
    } finally {
      setIsDeletingProduct(false)
    }
  }

  return (
    <div className="space-y-5">
      {editing ? (
        <ProductEditModal
          product={editing}
          collectionOptions={collectionOptions}
          defaultCollectionSlug={collectionSlug}
          onClose={() => setEditing(null)}
          onSaved={(next) => {
            setProducts((prev) => prev.map((x) => (x.id === next.id ? next : x)))
            setEditing(null)
            notifySiteCatalogChanged()
          }}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl tracking-wide text-neutral-900">
            {isCollectionView ? `Colección ${collectionLabel ?? ''}` : 'Productos'}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">{products.length} productos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isCollectionView && selectedCount > 0 ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const selected = products.filter((p) => selectedIds.has(p.id))
                if (selected.length === 0) return
                setDeleteConfirm({ products: selected })
              }}
            >
              Eliminar seleccionados ({selectedCount})
            </Button>
          ) : null}
          {!isCollectionView ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSyncingWithStripe}
            onClick={async () => {
              setIsSyncingWithStripe(true)
              setSyncFailures([])
              try {
                const result = await adminSyncProductsWithStripe()
                if (!result.success && result.failedSyncs.length === 0) {
                  toast.error('No se pudo completar la sincronización con Stripe')
                  return
                }
                setSyncFailures(result.failedSyncs)
                if (result.failedSyncs.length > 0) {
                  toast.error(`Sincronizados: ${result.syncedCount}. Revisa los errores.`)
                  return
                }
                toast.success(`${result.syncedCount} producto(s) sincronizado(s) con Stripe`)
              } finally {
                setIsSyncingWithStripe(false)
              }
            }}
          >
            {isSyncingWithStripe ? 'Sincronizando…' : 'Sincronizar con Stripe'}
          </Button>
          ) : null}
          <Link
            href={
              collectionSlug
                ? `/admin/nuevo-producto?coleccion=${encodeURIComponent(collectionSlug)}`
                : '/admin/nuevo-producto'
            }
            className="inline-flex items-center gap-2 bg-neutral-900 px-4 py-2.5 text-xs uppercase tracking-wider text-white hover:bg-neutral-800"
          >
            <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
            Nuevo producto
          </Link>
        </div>
      </div>

      {!isCollectionView && syncFailures.length > 0 ? (
        <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-900">
          <AlertTitle>Errores en la sincronización con Stripe</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {syncFailures.map((item) => (
                <li key={`${item.name}-${item.reason}`}>
                  <span className="font-medium">{item.name}:</span> {item.reason}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={1.5} />
        <input
          type="search"
          placeholder="Buscar nombre, categoría o id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-neutral-400 focus:outline-none"
        />
      </div>

      <AdminDataTable data={filtered} columns={columns} pageSize={10} pageSizeOptions={[10, 25, 50, 100]} />

      <AlertDialog
        open={deleteConfirm != null}
        onOpenChange={(open) => {
          if (!open && !isDeletingProduct) setDeleteConfirm(null)
        }}
      >
        <AlertDialogContent className="border-neutral-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif tracking-wide text-neutral-900">
              {isBulkDelete ? `¿Eliminar ${productsPendingDelete.length} productos?` : '¿Eliminar este producto?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <DeleteProductDialogDescription products={productsPendingDelete} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={isDeletingProduct}
              className="border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingProduct}
              onClick={() => void confirmDeleteProducts()}
            >
              {isDeletingProduct ? 'Eliminando…' : isBulkDelete ? `Eliminar ${productsPendingDelete.length}` : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
