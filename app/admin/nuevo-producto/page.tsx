'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Image as ImageIcon, UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['pendientes', 'mantones', 'accesorios', 'peinecillos', 'broches', 'pulseras', 'collares', 'bolsos']

interface UploadedImage {
  id: string
  url: string
  name: string
  file?: File
}

export default function NuevoProductoPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'pendientes',
    is_new_arrival: false,
  })

  const [images, setImages] = useState<UploadedImage[]>([])
  const [dragging, setDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setImages((prev) => [...prev, { id: crypto.randomUUID(), url, name: file.name, file }])
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  const removeImage = (id: string) => setImages((prev) => prev.filter((img) => img.id !== id))

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'El nombre es obligatorio'
    if (!form.price || isNaN(Number(form.price))) next.price = 'Introduce un precio válido'
    if (images.length === 0) next.images = 'Sube al menos una imagen'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1500
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Canvas to Blob failed'))
            },
            'image/webp',
            0.8,
          )
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (isSaving) return
    setIsSaving(true)

    try {
      const imageUrls: string[] = []

      for (const img of images) {
        if (!img.file) continue

        // Optimizar imagen antes de subir
        const compressedBlob = await compressImage(img.file)
        const fileName = `${crypto.randomUUID()}.webp`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        })
        if (uploadError) throw uploadError

        // Generamos la URL de Bunny directamente en lugar de usar getPublicUrl de Supabase
        const bunnyUrl = `https://marebo.b-cdn.net/${filePath}`
        imageUrls.push(bunnyUrl)
      }

      const image_url = imageUrls[0] || null
      const { error: insertError } = await supabase.from('products').insert([
        {
          name: form.name,
          description: form.description || null,
          price: Number(form.price),
          image_url,
          category: form.category,
          is_new_arrival: form.is_new_arrival,
          stripe_product_id: null,
          stripe_price_id: null,
        },
      ])

      if (insertError) throw insertError
      setSaved(true)
      setTimeout(() => router.push('/admin/productos'), 1200)
    } catch (error: any) {
      alert(`Error al guardar el producto: ${error?.message || 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-wide text-foreground">Nuevo Producto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Crea un producto en Supabase</p>
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
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Precio (€) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleField('price', e.target.value)}
                  suppressHydrationWarning
                  min="0"
                  step="0.01"
                  className={cn(
                    'w-full px-3 py-2.5 text-sm border bg-background focus:outline-none focus:border-foreground transition-colors',
                    errors.price ? 'border-destructive' : 'border-border',
                  )}
                />
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>
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

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_new_arrival}
                onChange={(e) => handleField('is_new_arrival', e.target.checked)}
                className="w-3.5 h-3.5 accent-foreground"
                suppressHydrationWarning
              />
              <span className="text-sm text-muted-foreground">Marcar como novedad</span>
            </label>
          </div>
        </div>

        <aside className="space-y-4">
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
              <p className="mt-3 text-sm text-muted-foreground">Arrastra imágenes o selecciona archivos</p>
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
                    <p className="text-xs text-muted-foreground truncate">{img.name}</p>
                    <button type="button" onClick={() => removeImage(img.id)} suppressHydrationWarning>
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
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
