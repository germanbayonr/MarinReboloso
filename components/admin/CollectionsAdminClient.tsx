'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminDeleteCollection } from '@/app/admin/collection-actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { CollectionRecord } from '@/lib/collections'

export type CollectionAdminRow = CollectionRecord & { productsCount: number }

export default function CollectionsAdminClient({ rows: initialRows }: { rows: CollectionAdminRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [toDelete, setToDelete] = useState<CollectionAdminRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl tracking-wide">Colecciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{rows.length} colecciones</p>
        </div>
        <Link
          href="/admin/colecciones/nueva"
          className="inline-flex items-center gap-2 bg-neutral-900 px-4 py-2.5 text-xs uppercase tracking-wider text-white hover:bg-neutral-800"
        >
          <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
          Nueva colección
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((col) => (
          <div key={col.slug} className="bg-white border border-border p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-serif text-base">{col.label}</h2>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5">
                  Portada #{col.homepage_order}
                </span>
                <button
                  type="button"
                  onClick={() => setToDelete(col)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                  aria-label={`Eliminar colección ${col.label}`}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {col.visible_on_homepage ? (
                <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5">En portada</span>
              ) : (
                <span className="text-[10px] bg-neutral-50 text-neutral-500 px-2 py-0.5">Sin portada</span>
              )}
              {col.visible_on_site ? (
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5">Web visible</span>
              ) : (
                <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5">Web oculta</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">/{col.slug}</p>
              <p className="text-sm">{col.productsCount} productos</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/colecciones/${col.slug}`}
                className="text-xs underline text-foreground hover:opacity-70"
              >
                Gestionar
              </Link>
              {col.visible_on_site ? (
                <Link
                  href={`/coleccion/${col.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-muted-foreground hover:text-foreground"
                >
                  Ver en tienda
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={toDelete != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setToDelete(null)
        }}
      >
        <AlertDialogContent className="max-w-sm border-neutral-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-base tracking-wide text-neutral-900">
              ¿Eliminar colección?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-600">
              {toDelete ? (
                <>
                  Se eliminará <strong>{toDelete.label}</strong> ({toDelete.productsCount} productos quedarán sin
                  colección asignada). Esta acción no se puede deshacer.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting} className="border-neutral-200 text-neutral-700 hover:bg-neutral-50">
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                if (!toDelete) return
                setIsDeleting(true)
                try {
                  const res = await adminDeleteCollection(toDelete.slug)
                  if (!res.ok) {
                    toast.error(res.error)
                    return
                  }
                  setRows((prev) => prev.filter((row) => row.slug !== toDelete.slug))
                  toast.success('Colección eliminada')
                  setToDelete(null)
                  router.refresh()
                } finally {
                  setIsDeleting(false)
                }
              }}
            >
              {isDeleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
