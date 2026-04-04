'use client'

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { Search } from 'lucide-react'
import type { AdminCustomer } from '@/lib/admin/types'

export default function ClientesAdminClient({ initialRows }: { initialRows: AdminCustomer[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return initialRows
    return initialRows.filter((c) => {
      const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase()
      const mail = (c.email ?? '').toLowerCase()
      return name.includes(q) || mail.includes(q)
    })
  }, [initialRows, search])

  const columns = useMemo<ColumnDef<AdminCustomer>[]>(
    () => [
      {
        id: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="font-medium text-neutral-900">
            {[row.original.first_name, row.original.last_name].filter(Boolean).join(' ') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) ?? '—'}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) ?? '—'}</span>,
      },
      {
        accessorKey: 'shipping_address',
        header: 'Dirección de envío',
        cell: ({ getValue }) => (
          <span className="max-w-xs text-xs text-neutral-600 line-clamp-2">{(getValue() as string) ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Alta',
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500">
            {new Date(getValue() as string).toLocaleDateString('es-ES')}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl tracking-wide text-neutral-900">Clientes</h1>
        <p className="mt-0.5 text-sm text-neutral-500">{initialRows.length} registros (solo lectura)</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" strokeWidth={1.5} />
        <input
          type="search"
          placeholder="Buscar por email o nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-neutral-400 focus:outline-none"
        />
      </div>
      <AdminDataTable data={filtered} columns={columns} pageSize={15} />
    </div>
  )
}
