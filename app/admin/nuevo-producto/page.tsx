'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, X, Image as ImageIcon, CheckCircle } from 'lucide-react'
import { useProducts } from '@/lib/products-context'
import { cn } from '@/lib/utils'

const CATEGORIES = ['pendientes', 'mantones', 'trajes', 'accesorios', 'cinturones', 'chokers', 'peinecillos']
const COLLECTIONS = ['Isabelita', 'Vintage', 'Esencial', 'Lost in Jaipur']

interface UploadedImage {
  id: string
  url: string
  name: string
}

export default function NuevoProductoPage() {
  const { addProduct } = useProducts()
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    price: '',
    sku: '',
    stock: '',
    status: 'draft' as 'draft' | 'published',
    category: 'pendientes',
    collection: 'Isabelita',
  })

  const [images, setImages] = useState<UploadedImage[]>([])
  const [dragging, setDragging] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setImages(prev => [...prev, { id: crypto.randomUUID(), url, name: file.name }])
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio'
    if (!form.price || isNaN(Number(form.price))) newErrors.price = 'Introduce un precio válido'
    if (!form.sku.trim()) newErrors.sku = 'El SKU es obligatorio'
    if (!form.stock || isNaN(Number(form.stock))) newErrors.stock = 'Introduce un stock válido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    // Preparado para: supabase.from('products').insert({ ...form, images: images.map(i => i.url) })
    addProduct({
      name: form.name,
      price: Number(form.price),
      sku: form.sku,
      stock: Number(form.stock),
      status: form.status,
      category: form.category,
      collection: form.collection,
      images: images.map(i => i.url),
    })
    setSaved(true)
    setTimeout(() => {
      router.push('/admin/productos')
    }, 1500)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-wide text-foreground">Nuevo Producto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Completa los campos para crear un producto</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            Guardado correctamente
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product info card */}
          <div className="bg-white border border-border p-6 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Información del producto</h2>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleField('name', e.target.value)}
                placeholder="Ej. Pendientes Lágrima de Coral"
                suppressHydrationWarning
                className={cn(
                  'w-full px-3 py-2.5 text-sm border bg-background focus:outline-none focus:border-foreground transition-colors',
                  errors.name ? 'border-destructive' : 'border-border'
                )}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Price + SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Precio (€) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => handleField('price', e.target.value)}
                  placeholder="65"
                  suppressHydrationWarning
                  min="0"
                  step="0.01"
                  className={cn(
                    'w-full px-3 py-2.5 text-sm border bg-background focus:outline-none focus:border-foreground transition-colors',
                    errors.price ? 'border-destructive' : 'border-border'
                  )}
                />
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">SKU *</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={e => handleField('sku', e.target.value)}
                  placeholder="PLC-001"
                  suppressHydrationWarning
                  className={cn(
                    'w-full px-3 py-2.5 text-sm border bg-background focus:outline-none focus:border-foreground transition-colors',
                    errors.sku ? 'border-destructive' : 'border-border'
                  )}
                />
                {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Stock *</label>
              <input
                type="number"
                value={form.stock}
                onChange={e => handleField('stock', e.target.value)}
                placeholder="10"
                suppressHydrationWarning
                min="0"
                className={cn(
                  'w-full px-3 py-2.5 text-sm border bg-background focus:outline-none focus:border-foreground transition-colors',
                  errors.stock ? 'border-destructive' : 'border-border'
                )}
              />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
            </div>
          </div>

          {/* Image upload */}
          <div className="bg-white border border-border p-6 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Imágenes del producto</h2>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-sm cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-10 gap-3',
                dragging
                  ? 'border-foreground bg-secondary/60 scale-[1.01]'
                  : 'border-border hover:border-foreground/40 hover:bg-secondary/30'
              )}
            >
              <UploadCloud className={cn('w-8 h-8 transition-colors', dragging ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-sm text-foreground">Arrastra imágenes aquí</p>
                <p className="text-xs text-muted-foreground mt-0.5">o <span className="underline">selecciona desde tu ordenador</span></p>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — Máx. 5MB por imagen</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => processFiles(e.target.files)}
                suppressHydrationWarning
              />
            </div>

            {/* Image preview grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={img.id} className="relative group aspect-square bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-foreground text-background px-1.5 py-0.5">
                        Principal
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      suppressHydrationWarning
                      className="absolute top-1 right-1 w-5 h-5 bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Add more */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  suppressHydrationWarning
                  className="aspect-square border-2 border-dashed border-border hover:border-foreground/40 flex items-center justify-center transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar fields */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white border border-border p-5 space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</h2>
            <div className="space-y-2">
              {(['published', 'draft'] as const).map(s => (
                <label key={s} className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={cn(
                      'w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-colors',
                      form.status === s ? 'border-foreground bg-foreground' : 'border-border'
                    )}
                  >
                    {form.status === s && <div className="w-2 h-2 bg-background" />}
                  </div>
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={form.status === s}
                    onChange={() => handleField('status', s)}
                    className="sr-only"
                    suppressHydrationWarning
                  />
                  <span className="text-sm capitalize">{s === 'published' ? 'Publicado' : 'Borrador'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="bg-white border border-border p-5 space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Categoría</h2>
            <select
              value={form.category}
              onChange={e => handleField('category', e.target.value)}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors appearance-none"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Collection */}
          <div className="bg-white border border-border p-5 space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Colección</h2>
            <select
              value={form.collection}
              onChange={e => handleField('collection', e.target.value)}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors appearance-none"
            >
              {COLLECTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="space-y-2">
            <button
              type="submit"
              suppressHydrationWarning
              className="w-full bg-foreground text-background py-3 text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors"
            >
              Guardar producto
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/productos')}
              suppressHydrationWarning
              className="w-full border border-border py-3 text-sm uppercase tracking-wider text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
