'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Image as ImageIcon, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { createProduct } from '@/app/admin/actions'
import { notifySiteCatalogChanged } from '@/lib/catalog-events'
import { buildProductCollectionOptions, PRODUCT_COLLECTION_OPTIONS } from '@/lib/admin/product-collections'
import { uploadProductImagesToSupabase, validateAdminImageFile } from '@/lib/admin/upload-product-images-client'
import { computeFinalPrice } from '@/lib/pricing'
import ProductVariantsEditor from '@/components/admin/ProductVariantsEditor'
import { emptyProductVariants, type ProductVariantsData } from '@/lib/product-variants'

const CATEGORIES = ['pendientes', 'mantones', 'accesorios', 'peinecillos', 'broches', 'pulseras', 'collares', 'bolsos']

interface UploadedImage {
  id: string
  name: string
  /** URL pública en Supabase Storage (null mientras sube) */
  supabaseUrl: string | null
  previewUrl: string
  isUploading: boolean
  error?: string
}

export default function NuevoProductoClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const coleccionFromUrl = (searchParams.get('coleccion') ?? '').trim().toLowerCase()

  const [form, setForm] = useState({
    name: '',
    description: '',
    original_price: '',
    discount_percent: '0',
    category: 'pendientes',
    collection: coleccionFromUrl,
    is_new_arrival: false,
    in_stock: true,
  })

  const [images, setImages] = useState<UploadedImage[]>([])
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState<ProductVariantsData>(emptyProductVariants())
  const [dragging, setDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [collectionOptions, setCollectionOptions] = useState(PRODUCT_COLLECTION_OPTIONS)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (coleccionFromUrl) {
      setForm((prev) => (prev.collection === coleccionFromUrl ? prev : { ...prev, collection: coleccionFromUrl }))
    }
  }, [coleccionFromUrl])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/collections')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { slug: string; label: string }[]) => {
        if (cancelled || !Array.isArray(rows) || rows.length === 0) return
        setCollectionOptions(buildProductCollectionOptions(rows))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const uploadSingleFile = useCallback(async (file: File) => {
    const check = validateAdminImageFile(file)
    if (!check.ok) {
      toast.error(check.error)
      return
    }
    const id = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    setImages((prev) => [
      ...prev,
      { id, name: file.name, supabaseUrl: null, previewUrl, isUploading: true },
    ])

    const res = await uploadProductImagesToSupabase([file])
    if (!res.ok) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, isUploading: false, error: res.error } : img,
        ),
      )
      toast.error(res.error)
      return
    }

    const supabaseUrl = res.urls[0] ?? null
    if (!supabaseUrl) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, isUploading: false, error: 'No se obtuvo URL' } : img,
        ),
      )
      return
    }

    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, supabaseUrl, isUploading: false, error: undefined } : img,
      ),
    )
    toast.success('Imagen subida a Supabase')
  }, [])

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      void Promise.all(Array.from(files).map((file) => uploadSingleFile(file)))
    },
    [uploadSingleFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  const removeImage = (id: string) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id)
      if (removed?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((img) => img.id !== id)
    })
  }

  const uploadedUrls = images.map((img) => img.supabaseUrl).filter((url): url is string => !!url)
  const isUploadingImages = images.some((img) => img.isUploading)

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'El nombre es obligatorio'
    if (!form.original_price || isNaN(Number(form.original_price))) next.original_price = 'Introduce un precio original válido'
    if (isUploadingImages) next.images = 'Espera a que terminen de subirse las imágenes'
    else if (hasVariants) {
      if (!variants.items.length) next.variants = 'Añade al menos una variante con imagen'
      else if (variants.items.some((item) => !item.image_url.trim())) {
        next.variants = 'Cada variante necesita su imagen en Supabase'
      }
    } else if (uploadedUrls.length === 0) next.images = 'Sube al menos una imagen a Supabase'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (isSaving) return
    setIsSaving(true)

    try {
      const variantUrls = variants.items.map((i) => i.image_url.trim()).filter(Boolean)
      const res = await createProduct({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        collection: form.collection.trim() || null,
        image_url: hasVariants ? variantUrls[0] ?? null : uploadedUrls[0] ?? null,
        image_urls: hasVariants ? variantUrls : uploadedUrls,
        is_new_arrival: form.is_new_arrival,
        in_stock: form.in_stock,
        original_price: Number(form.original_price),
        discount_percent: Math.min(100, Math.max(0, Number(form.discount_percent) || 0)),
        has_variants: hasVariants,
        variants: hasVariants ? variants : undefined,
      })
      if (!res.ok) throw new Error(res.error)
      notifySiteCatalogChanged()
      setSaved(true)
      const redirectTo = coleccionFromUrl
        ? `/admin/colecciones/${encodeURIComponent(coleccionFromUrl)}`
        : '/admin/productos'
      setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 1200)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al guardar el producto: ${msg}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          {coleccionFromUrl ? (
            <Link
              href={`/admin/colecciones/${encodeURIComponent(coleccionFromUrl)}`}
              className="mb-2 inline-block text-sm text-muted-foreground underline hover:text-foreground"
            >
              ← Volver a la colección
            </Link>
          ) : null}
          <h1 className="font-serif text-2xl tracking-wide text-foreground">Nuevo Producto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {coleccionFromUrl
              ? 'Se asignará a la colección desde la que has abierto este formulario'
              : 'Crea un producto en Supabase'}
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            Guardado correctamente
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-border p-6 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Información</h2>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleField('name', e.target.value)}
                suppressHydrationWarning
                className={cn(
                  'w-full px-3 py-2.5 text-sm border bg-background focus:outline-none focus:border-foreground transition-colors',
                  errors.name ? 'border-destructive' : 'border-border',
                )}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Precio original (€) *</label>
                <input
                  type="number"
                  value={form.original_price}
                  onChange={(e) => handleField('original_price', e.target.value)}
                  suppressHydrationWarning
                  min="0"
                  step="0.01"
                  className={cn(
                    'w-full px-3 py-2.5 text-sm border bg-background focus:outline-none focus:border-foreground transition-colors',
                    errors.original_price ? 'border-destructive' : 'border-border',
                  )}
                />
                {errors.original_price ? <p className="text-xs text-destructive">{errors.original_price}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Descuento (%)</label>
                <input
                  type="number"
                  value={form.discount_percent}
                  onChange={(e) => handleField('discount_percent', e.target.value)}
                  suppressHydrationWarning
                  min="0"
                  max="100"
                  step="1"
                  className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
            <p className="text-sm text-foreground">
              Precio final calculado:{' '}
              <span className="font-medium">
                {computeFinalPrice(Number(form.original_price) || 0, Number(form.discount_percent) || 0).toFixed(2)}€
              </span>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => handleField('category', e.target.value)}
                suppressHydrationWarning
                className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Colección</label>
              <select
                value={form.collection}
                onChange={(e) => handleField('collection', e.target.value)}
                disabled={!!coleccionFromUrl}
                suppressHydrationWarning
                className={cn(
                  'w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors',
                  coleccionFromUrl && 'cursor-not-allowed opacity-80',
                )}
              >
                <option value="">Sin colección</option>
                {coleccionFromUrl && !collectionOptions.some((o) => o.slug === coleccionFromUrl) ? (
                  <option value={coleccionFromUrl}>{coleccionFromUrl}</option>
                ) : null}
                {collectionOptions.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.label}
                  </option>
                ))}
              </select>
              {coleccionFromUrl ? (
                <p className="text-xs text-muted-foreground">
                  Colección fijada. Para otro destino, crea el producto desde Productos.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => handleField('description', e.target.value)}
                rows={5}
                suppressHydrationWarning
                className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors resize-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={form.is_new_arrival}
                onChange={(e) => handleField('is_new_arrival', e.target.checked)}
                className="h-3.5 w-3.5 accent-foreground"
                suppressHydrationWarning
              />
              <span className="text-sm text-muted-foreground">Marcar como novedad</span>
            </label>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <div>
                <p className="text-sm text-foreground">Disponible en tienda</p>
                <p className="text-xs text-muted-foreground">Desactiva si está agotado</p>
              </div>
              <Switch checked={form.in_stock} onCheckedChange={(v) => handleField('in_stock', v)} />
            </div>

            <ProductVariantsEditor
              hasVariants={hasVariants}
              variants={variants}
              onHasVariantsChange={setHasVariants}
              onVariantsChange={setVariants}
            />
            {errors.variants ? <p className="text-xs text-destructive">{errors.variants}</p> : null}
          </div>
        </div>

        <aside className="space-y-4">
          {!hasVariants ? (
          <div className="bg-white border border-border p-6 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Imágenes *</h2>
            <div
              className={cn(
                'border border-dashed rounded-md p-6 text-center transition-colors',
                dragging ? 'border-foreground bg-secondary/50' : 'border-border',
              )}
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <UploadCloud className="w-6 h-6 mx-auto text-muted-foreground" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-muted-foreground">
                Se suben al instante a Supabase Storage
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 border border-border px-4 py-2 text-[10px] tracking-[0.3em] uppercase hover:bg-foreground hover:text-background transition-colors"
                suppressHydrationWarning
              >
                <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
                Seleccionar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => processFiles(e.target.files)}
              />
              {errors.images ? <p className="mt-3 text-xs text-destructive">{errors.images}</p> : null}
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((img) => (
                  <div key={img.id} className="flex items-center justify-between gap-3 border border-border px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">{img.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {img.isUploading
                          ? 'Subiendo a Supabase…'
                          : img.error
                            ? img.error
                            : img.supabaseUrl
                              ? 'En Supabase ✓'
                              : 'Pendiente'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      disabled={img.isUploading}
                      suppressHydrationWarning
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          ) : (
            <div className="bg-white border border-border p-6 text-sm text-muted-foreground">
              Las imágenes se configuran en cada variante (colores / tallas).
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || isUploadingImages}
            className="w-full bg-foreground text-background py-3 text-xs tracking-[0.3em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-60"
            suppressHydrationWarning
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </aside>
      </form>
    </div>
  )
}
