'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, CheckCircle, Pencil, PlusCircle, Search, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
import { Switch } from '@/components/ui/switch'
import AdminDataTable from '@/components/admin/AdminDataTable'
import {
  adminSetProductCatalogVisible,
  adminSetProductStock,
  adminUploadProductImages,
  deleteProduct,
  updateProduct,
} from '@/app/admin/actions'
import { computeFinalPrice, hasActiveDiscount } from '@/lib/pricing'
import { labelForCollectionSlug, PRODUCT_COLLECTION_OPTIONS } from '@/lib/admin/product-collections'
import type { AdminProduct } from '@/lib/admin/types'

const CATEGORIES = ['pendientes', 'mantones', 'accesorios', 'peinecillos', 'broches', 'pulseras', 'collares', 'bolsos']

function EditModal({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct
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
  const [form, setForm] = useState({
    name: product.name,
    description: product.description ?? '',
    original_price: String(origBase),
    discount_percent: String(product.discount_percent ?? 0),
    category: product.category ?? 'accesorios',
    collection: product.collection ?? '',
    image_url: product.image_url ?? '',
    is_new_arrival: product.is_new_arrival,
    in_stock: product.in_stock,
  })
  const [images, setImages] = useState<string[]>(initialImages)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const collectionUnknownInList =
    !!form.collection && !PRODUCT_COLLECTION_OPTIONS.some((o) => o.slug === form.collection)
  const [saved, setSaved] = useState(false)

  const o = Number(form.original_price) || 0
  const d = Math.min(100, Math.max(0, Number(form.discount_percent) || 0))
  const finalPreview = computeFinalPrice(o, d)

  const handleSave = async () => {
    const cleanedImages = images.map((url) => url.trim()).filter(Boolean)
    // #region agent log
    fetch('http://127.0.0.1:7707/ingest/e8400cbe-b1e2-4406-94b7-cd688b9093e0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bc8ce7'},body:JSON.stringify({sessionId:'bc8ce7',runId:'pre-fix',hypothesisId:'H2',location:'components/admin/ProductsAdminClient.tsx:66',message:'handleSave payload preview',data:{productId:product.id,cleanedImagesCount:cleanedImages.length,hasFallbackImageUrl:Boolean(form.image_url?.trim())},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    const res = await updateProduct(product.id, {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      collection: form.collection.trim() || null,
      image_url: cleanedImages[0] ?? (form.image_url.trim() || null),
      image_urls: cleanedImages,
      is_new_arrival: form.is_new_arrival,
      in_stock: form.in_stock,
      original_price: o,
      discount_percent: d,
    })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    onSaved({
      ...product,
      name: form.name.trim(),
      description: form.description.trim() || null,
      original_price: o,
      discount_percent: d,
      price: finalPreview,
      category: form.category,
      collection: form.collection.trim() || null,
      image_url: cleanedImages[0] ?? null,
      image_urls: cleanedImages,
      is_new_arrival: form.is_new_arrival,
      in_stock: form.in_stock,
    })
    setSaved(true)
    toast.success('Producto actualizado')
    setTimeout(onClose, 600)
  }

  const handleAppendImageUrl = () => {
    const trimmed = newImageUrl.trim()
    if (!trimmed) return
    if (images.includes(trimmed)) {
      toast.error('Esa imagen ya está en la galería')
      return
    }
    setImages((prev) => [...prev, trimmed])
    setNewImageUrl('')
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === images.length - 1)) return
    setImages((prev) => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      const current = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = current
      return next
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append('images', file))
    setUploadingImages(true)
    try {
      const res = await adminUploadProductImages(formData)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setImages((prev) => [...prev, ...res.urls])
      toast.success(`${res.urls.length} imagen(es) subida(s)`)
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
              {PRODUCT_COLLECTION_OPTIONS.map((o) => (
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

export default function ProductsAdminClient({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const [products, setProducts] = useState(initialProducts ?? [])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.collection ?? '').toLowerCase().includes(q) ||
        labelForCollectionSlug(p.collection).toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    )
  }, [products, search])

  const columns = useMemo<ColumnDef<AdminProduct>[]>(
    () => [
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
          <span className="text-neutral-600 text-xs">{labelForCollectionSlug(row.original.collection)}</span>
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
                  setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, in_stock: v } : x)))
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
                  setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: v } : x)))
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
                onClick={() => setDeleteTarget(p)}
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
    [],
  )

  return (
    <div className="space-y-5">
      {editing ? (
        <EditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={(next) => {
            setProducts((prev) => prev.map((x) => (x.id === next.id ? next : x)))
            setEditing(null)
          }}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl tracking-wide text-neutral-900">Productos</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{products.length} productos</p>
        </div>
        <Link
          href="/admin/nuevo-producto"
          className="inline-flex items-center gap-2 bg-neutral-900 px-4 py-2.5 text-xs uppercase tracking-wider text-white hover:bg-neutral-800"
        >
          <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
          Nuevo producto
        </Link>
      </div>

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

      <AdminDataTable data={filtered} columns={columns} pageSize={12} />

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !isDeletingProduct) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent className="border-neutral-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif tracking-wide text-neutral-900">
              ¿Eliminar este producto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-600">
              Se borrará por completo.
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
              onClick={async () => {
                if (!deleteTarget) return
                setIsDeletingProduct(true)
                try {
                  const res = await deleteProduct(deleteTarget.id)
                  if (!res.ok) {
                    toast.error(res.error)
                    return
                  }
                  setProducts((prev) => prev.filter((x) => x.id !== deleteTarget.id))
                  toast.success('Producto e imágenes eliminados')
                  setDeleteTarget(null)
                } finally {
                  setIsDeletingProduct(false)
                }
              }}
            >
              {isDeletingProduct ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
