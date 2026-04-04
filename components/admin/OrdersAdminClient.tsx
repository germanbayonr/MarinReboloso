'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { adminUpdateOrderStatus, type AdminOrderStatusPayload } from '@/app/admin/actions'
import { ORDER_STATUSES, type AdminOrder, type OrderStatus } from '@/lib/admin/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
}

/** Estados que disparan correo al cliente y requieren confirmación explícita */
const MAIL_CONFIRM_STATUSES: OrderStatus[] = ['enviado', 'entregado', 'cancelado', 'reembolsado']

const STATUS_SELECT_CLASS: Record<string, string> = {
  pendiente: 'border-amber-300 bg-amber-50 text-amber-950',
  preparando: 'border-sky-300 bg-sky-50 text-sky-950',
  enviado: 'border-emerald-400 bg-emerald-50 text-emerald-950',
  entregado: 'border-green-600 bg-green-50 text-green-950',
  cancelado: 'border-red-300 bg-red-50 text-red-950',
  reembolsado: 'border-violet-400 bg-violet-50 text-violet-950',
}

function statusSelectClass(status: string): string {
  return STATUS_SELECT_CLASS[status] ?? 'border-neutral-200 bg-white text-neutral-900'
}

/** total_amount en unidad principal (ej. euros), no céntimos */
function formatCurrencyAmount(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null || !Number.isFinite(amount)) return '—'
  const c = (currency ?? 'eur').trim() || 'eur'
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: c.toUpperCase() }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${c}`
  }
}

function safeResumenText(row: AdminOrder): string {
  const summary = row.line_summary?.trim()
  if (summary) return summary
  const raw = row.items_json
  if (raw == null) return 'Sin detalle'
  if (Array.isArray(raw) && raw.length === 0) return 'Sin artículos'
  try {
    return JSON.stringify(raw).slice(0, 120)
  } catch {
    return 'Sin detalle'
  }
}

function safeOrderIdPreview(id: string | null | undefined): string {
  const s = String(id ?? '').trim()
  if (s.length < 2) return '—'
  return s.slice(0, 5).toUpperCase()
}

function safeDateLabel(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function confirmModalCopy(next: OrderStatus): { title: string; description: string } {
  switch (next) {
    case 'enviado':
      return {
        title: 'Marcar como enviado',
        description:
          'Indica si el envío es por Correos o Packlink. Al confirmar, se guardará el seguimiento y se enviará un correo al cliente con la plantilla de envío.',
      }
    case 'entregado':
      return {
        title: 'Marcar como entregado',
        description:
          'Se notificará al cliente por correo (plantilla de pedido entregado) a su dirección de email del pedido.',
      }
    case 'cancelado':
      return {
        title: 'Cancelar pedido',
        description:
          'Se enviará un correo al cliente informando de la cancelación (plantilla específica).',
      }
    case 'reembolsado':
      return {
        title: 'Marcar como reembolsado',
        description:
          'Se enviará un correo al cliente sobre el reembolso (plantilla específica). El plazo bancario puede variar.',
      }
    default:
      return { title: 'Confirmar', description: '' }
  }
}

export default function OrdersAdminClient({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [pending, setPending] = useState<{
    order: AdminOrder
    next: OrderStatus
  } | null>(null)
  const [carrier, setCarrier] = useState<'correos' | 'packlink'>('correos')
  const [trackingInput, setTrackingInput] = useState('')
  const [packlinkInput, setPacklinkInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    if (!statusFilter) return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  const applyStatusChange = useCallback(
    async (order: AdminOrder, next: OrderStatus, payload?: AdminOrderStatusPayload) => {
      const res = await adminUpdateOrderStatus(order.id, next, payload)
      if (!res.ok) {
        toast.error(res.error)
        return false
      }
      setOrders((prev) =>
        prev.map((x) => (x.id === order.id ? { ...x, status: next, ...mergeShippingFields(payload) } : x)),
      )
      toast.success('Estado actualizado. Si había email, se ha enviado el aviso.')
      return true
    },
    [],
  )

  function mergeShippingFields(payload?: AdminOrderStatusPayload): Partial<AdminOrder> {
    if (!payload?.shippingCarrier) return {}
    if (payload.shippingCarrier === 'correos') {
      return {
        shipping_carrier: 'correos',
        tracking_number: payload.trackingNumber?.trim() ?? null,
        packlink_url: null,
      }
    }
    return {
      shipping_carrier: 'packlink',
      packlink_url: payload.packlinkUrl?.trim() ?? null,
      tracking_number: null,
    }
  }

  const handleSelectChange = useCallback(
    async (order: AdminOrder, next: OrderStatus) => {
      if (next === order.status) return
      if (MAIL_CONFIRM_STATUSES.includes(next)) {
        setCarrier('correos')
        setTrackingInput(typeof order.tracking_number === 'string' ? order.tracking_number : '')
        setPacklinkInput(typeof order.packlink_url === 'string' ? order.packlink_url : '')
        if (order.shipping_carrier === 'packlink') setCarrier('packlink')
        else if (order.shipping_carrier === 'correos') setCarrier('correos')
        setPending({ order, next })
        return
      }
      await applyStatusChange(order, next)
    },
    [applyStatusChange],
  )

  const confirmPending = useCallback(async () => {
    if (!pending) return
    const { order, next } = pending

    let payload: AdminOrderStatusPayload | undefined
    if (next === 'enviado') {
      payload = {
        shippingCarrier: carrier,
        trackingNumber: carrier === 'correos' ? trackingInput.trim() : null,
        packlinkUrl: carrier === 'packlink' ? packlinkInput.trim() : null,
      }
      if (carrier === 'correos' && !payload.trackingNumber) {
        toast.error('Introduce el número de seguimiento de Correos.')
        return
      }
      if (carrier === 'packlink' && !payload.packlinkUrl) {
        toast.error('Introduce el enlace de seguimiento de Packlink.')
        return
      }
    }

    setSubmitting(true)
    try {
      const ok = await applyStatusChange(order, next, payload)
      if (ok) setPending(null)
    } finally {
      setSubmitting(false)
    }
  }, [pending, carrier, trackingInput, packlinkInput, applyStatusChange])

  const columns = useMemo<ColumnDef<AdminOrder>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ getValue }) => (
          <span className="font-mono text-[11px] text-neutral-500">{safeOrderIdPreview(getValue() as string)}</span>
        ),
      },
      {
        id: 'customer',
        header: 'Cliente',
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-neutral-900">{row.original.customer_name?.trim() || 'Sin nombre'}</p>
            <p className="text-xs text-neutral-500">{row.original.customer_email?.trim() || 'Email desconocido'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'line_summary',
        header: 'Resumen',
        cell: ({ row }) => (
          <span className="text-xs text-neutral-600 line-clamp-2">{safeResumenText(row.original)}</span>
        ),
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <span className="text-sm">
            {formatCurrencyAmount(row.original.total_amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Fecha',
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-600">{safeDateLabel(getValue() as string)}</span>
        ),
      },
      {
        id: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const o = row.original
          const st = o.status ?? 'pendiente'
          return (
            <select
              value={st}
              onChange={(e) => {
                void handleSelectChange(o, e.target.value as OrderStatus)
              }}
              className={`max-w-[160px] rounded-md border px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-400/40 ${statusSelectClass(st)}`}
            >
              {o.status && !ORDER_STATUSES.includes(o.status as OrderStatus) ? (
                <option value={o.status}>{o.status}</option>
              ) : null}
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s] ?? s}
                </option>
              ))}
            </select>
          )
        },
      },
    ],
    [handleSelectChange],
  )

  const modalCopy = pending ? confirmModalCopy(pending.next) : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl tracking-wide text-neutral-900">Pedidos</h1>
        <p className="mt-0.5 text-sm text-neutral-500">{orders.length} pedidos</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-neutral-500">
          Filtrar por estado{' '}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 border border-neutral-200 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <AdminDataTable data={filtered} columns={columns} pageSize={10} />

      <Dialog
        open={pending != null}
        onOpenChange={(open) => {
          if (!open && !submitting) setPending(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!submitting}>
          {pending && modalCopy ? (
            <>
              <DialogHeader>
                <DialogTitle>{modalCopy.title}</DialogTitle>
                <DialogDescription className="text-left">{modalCopy.description}</DialogDescription>
              </DialogHeader>

              {pending.next === 'enviado' ? (
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-neutral-800">Transporte</Label>
                    <RadioGroup
                      value={carrier}
                      onValueChange={(v) => setCarrier(v as 'correos' | 'packlink')}
                      className="flex flex-col gap-2"
                    >
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50">
                        <RadioGroupItem value="correos" id="c-correos" />
                        <span>Correos</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50">
                        <RadioGroupItem value="packlink" id="c-packlink" />
                        <span>Packlink</span>
                      </label>
                    </RadioGroup>
                  </div>
                  {carrier === 'correos' ? (
                    <div className="space-y-2">
                      <Label htmlFor="tracking-correos">Número de seguimiento (Correos)</Label>
                      <Input
                        id="tracking-correos"
                        placeholder="Ej. PQ123456789ES"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="packlink-url">Enlace de seguimiento Packlink</Label>
                      <Input
                        id="packlink-url"
                        type="url"
                        placeholder="https://…"
                        value={packlinkInput}
                        onChange={(e) => setPacklinkInput(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>
              ) : null}

              <p className="text-xs text-neutral-500">
                El correo se envía con la cuenta SMTP configurada (p. ej. Gmail) al email del cliente:{' '}
                <strong className="text-neutral-700">
                  {pending.order.customer_email?.trim() || '— (no se enviará)'}
                </strong>
              </p>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" disabled={submitting} onClick={() => setPending(null)}>
                  Cancelar
                </Button>
                <Button type="button" disabled={submitting} onClick={() => void confirmPending()}>
                  {submitting ? 'Guardando…' : 'Confirmar y enviar correo'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
