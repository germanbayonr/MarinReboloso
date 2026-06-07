'use client'

import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPaginationPageItems } from '@/lib/pagination-range'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 12, 25, 50, 100]

type AdminDataTableProps<T> = {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  pageSize?: number
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
}

function PageNumberButton({
  page,
  isActive,
  onClick,
}: {
  page: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ir a la página ${page}`}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 min-w-8 items-center justify-center border px-2 text-xs tabular-nums',
        isActive
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50',
      )}
    >
      {page}
    </button>
  )
}

export default function AdminDataTable<T>({
  data,
  columns,
  pageSize = 15,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showPageSizeSelector = true,
}: AdminDataTableProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
  })

  const resolvedPageSizeOptions = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b)

  const pageCount = table.getPageCount() || 1
  const currentPage = table.getState().pagination.pageIndex + 1
  const pageItems = getPaginationPageItems(currentPage, pageCount)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-neutral-200 bg-neutral-50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-[10px] font-normal uppercase tracking-wider text-neutral-500"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 align-middle text-neutral-800">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-neutral-500">Sin resultados.</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
        <span>
          {data.length} resultado{data.length === 1 ? '' : 's'} · Página {currentPage} de {pageCount}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {showPageSizeSelector ? (
            <label className="flex items-center gap-2">
              <span className="text-neutral-500">Por página</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                  table.setPageIndex(0)
                }}
                className="border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800"
                aria-label="Filas por página"
              >
                {resolvedPageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <nav className="flex items-center gap-1" aria-label="Paginación">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white',
                !table.getCanPreviousPage() && 'opacity-40',
              )}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex h-8 w-8 items-center justify-center text-neutral-400"
                  aria-hidden
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <PageNumberButton
                  key={item}
                  page={item}
                  isActive={item === currentPage}
                  onClick={() => table.setPageIndex(item - 1)}
                />
              ),
            )}
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white',
                !table.getCanNextPage() && 'opacity-40',
              )}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
