'use client'

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, PlusCircle, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPromotion,
  deletePromotion,
  togglePromotionActive,
  updatePromotion,
} from '@/app/admin/promotions/actions'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { PromotionRow } from '@/lib/promotions'

type PromotionTypeLabel = {
  value: PromotionRow['type']
  label: string
}

const TYPE_OPTIONS: PromotionTypeLabel[] = [
  { value: 'code_only', label: 'Código promocional simple' },
  { value: 'banner_popup', label: 'Banner emergente con código' },
  { value: 'header_bar', label: 'Barra superior / Header con código' },
]

function typeLabel(value: string) {
  const found = TYPE_OPTIONS.find((option) => option.value === value)
  return found?.label ?? value
}

function generatePromoCode() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 6 })
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join('')
}

function generatePromoCodeWithLength(length: number) {
  const size = Number.isFinite(length) ? Math.min(32, Math.max(3, Math.floor(length))) : 6
  const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789'
  return Array.from({ length: size })
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join('')
}

export default function PromotionsAdminClient({ initialPromotions }: { initialPromotions: PromotionRow[] }) {
  const [promotions, setPromotions] = useState(initialPromotions)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<PromotionRow | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [codeLength, setCodeLength] = useState(6)
  const [toDelete, setToDelete] = useState<PromotionRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [form, setForm] = useState({
    type: 'code_only' as PromotionRow['type'],
    code: generatePromoCode(),
    discountPercentage: '10',
    announcementText: '',
  })

  const columns = useMemo<ColumnDef<PromotionRow>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ getValue }) => <span className="text-xs text-neutral-700">{typeLabel(String(getValue()))}</span>,
      },
      {
        accessorKey: 'code',
        header: 'Código',
        cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-900">{String(getValue())}</span>,
      },
      {
        accessorKey: 'discount_percentage',
        header: 'Descuento',
        cell: ({ getValue }) => <span>{Number(getValue()).toFixed(0)}%</span>,
      },
      {
        accessorKey: 'announcement_text',
        header: 'Texto',
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-600 line-clamp-2">{String(getValue() ?? '—')}</span>
        ),
      },
      {
        id: 'active',
        header: 'Estado',
        cell: ({ row }) => (
          <Switch
            checked={row.original.is_active}
            onCheckedChange={async (next) => {
              const res = await togglePromotionActive(row.original.id, next)
              if (!res.ok) {
                toast.error(res.error)
                return
              }
              setPromotions((prev) =>
                prev.map((item) => (item.id === row.original.id ? res.promotion : item)),
              )
              toast.success(next ? 'Promoción activada' : 'Promoción desactivada')
            }}
          />
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              type="button"
              className="p-1.5 text-neutral-500 hover:text-neutral-900"
              onClick={() => {
                setEditing(row.original)
                setCreating(true)
                setForm({
                  type: row.original.type,
                  code: row.original.code,
                  discountPercentage: String(row.original.discount_percentage),
                  announcementText: row.original.announcement_text ?? '',
                })
              }}
              aria-label="Editar promoción"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 text-neutral-500 hover:text-red-600"
              onClick={() => setToDelete(row.original)}
              aria-label="Eliminar promoción"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  const showAnnouncement = form.type === 'banner_popup' || form.type === 'header_bar'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl tracking-wide text-neutral-900">Promociones</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{promotions.length} promociones</p>
        </div>
        <Button type="button" className="gap-2" onClick={() => setCreating(true)}>
          <PlusCircle className="h-4 w-4" />
          Nueva promoción
        </Button>
      </div>

      <AdminDataTable data={promotions} columns={columns} pageSize={12} />

      <Dialog
        open={creating}
        onOpenChange={(open) => {
          setCreating(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar promoción' : 'Nueva Promoción'}</DialogTitle>
            <DialogDescription>Configura códigos para checkout, banners o barra superior.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, type: event.target.value as PromotionRow['type'] }))
                }
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Código</Label>
              <div className="flex gap-2">
                <Input
                  value={form.code}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      code: event.target.value.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9Ñ]/g, ''),
                    }))
                  }
                  placeholder="SPRING15"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForm((prev) => ({ ...prev, code: generatePromoCodeWithLength(codeLength) }))}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Label className="text-xs text-neutral-500">Longitud auto-generada</Label>
                <Input
                  type="number"
                  min={3}
                  max={32}
                  value={codeLength}
                  onChange={(event) => setCodeLength(Number(event.target.value) || 6)}
                  className="h-8 w-20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descuento (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.discountPercentage}
                onChange={(event) => setForm((prev) => ({ ...prev, discountPercentage: event.target.value }))}
              />
            </div>

            {showAnnouncement ? (
              <div className="space-y-2">
                <Label>Texto del Anuncio</Label>
                <Textarea
                  rows={3}
                  placeholder="DESCUENTOS DE PRIMAVERA -15% EN TODA LA WEB"
                  value={form.announcementText}
                  onChange={(event) => setForm((prev) => ({ ...prev, announcementText: event.target.value }))}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true)
                try {
                  const upsertRes = editing
                    ? await updatePromotion(editing.id, {
                        type: form.type,
                        code: form.code,
                        discountPercentage: Number(form.discountPercentage),
                        announcementText: showAnnouncement ? form.announcementText : null,
                      })
                    : await createPromotion({
                        type: form.type,
                        code: form.code,
                        discountPercentage: Number(form.discountPercentage),
                        announcementText: showAnnouncement ? form.announcementText : null,
                      })
                  if (!upsertRes.ok) {
                    toast.error(upsertRes.error)
                    return
                  }
                  toast.success(editing ? 'Promoción actualizada' : 'Promoción creada')
                  setPromotions((prev) =>
                    editing
                      ? prev.map((item) => (item.id === upsertRes.promotion.id ? upsertRes.promotion : item))
                      : [upsertRes.promotion, ...prev],
                  )
                  setCreating(false)
                  setEditing(null)
                  setForm({
                    type: 'code_only',
                    code: generatePromoCode(),
                    discountPercentage: '10',
                    announcementText: '',
                  })
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              {editing ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={toDelete != null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás segura de eliminar esta promoción?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={async (event) => {
                event.preventDefault()
                if (!toDelete) return
                setIsDeleting(true)
                try {
                  const res = await deletePromotion(toDelete.id)
                  if (!res.ok) {
                    toast.error(res.error)
                    return
                  }
                  setPromotions((prev) => prev.filter((item) => item.id !== toDelete.id))
                  setToDelete(null)
                  toast.success('Promoción eliminada')
                } finally {
                  setIsDeleting(false)
                }
              }}
            >
              {isDeleting ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
