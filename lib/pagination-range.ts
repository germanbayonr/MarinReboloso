/** Páginas visibles con elipsis (1-based). Ej.: [1, 2, 3, 4, 5, 6, 'ellipsis', 23] */

const EDGE_VISIBLE = 6
const SIBLING_COUNT = 2

export function getPaginationPageItems(
  currentPage: number,
  totalPages: number,
): (number | 'ellipsis')[] {
  if (totalPages <= 0) return []
  if (totalPages === 1) return [1]
  if (totalPages <= EDGE_VISIBLE + 1) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages])

  if (currentPage <= EDGE_VISIBLE) {
    for (let i = 1; i <= EDGE_VISIBLE; i++) pages.add(i)
  } else if (currentPage > totalPages - EDGE_VISIBLE) {
    for (let i = totalPages - EDGE_VISIBLE + 1; i <= totalPages; i++) pages.add(i)
  } else {
    for (let i = currentPage - SIBLING_COUNT; i <= currentPage + SIBLING_COUNT; i++) {
      if (i >= 1 && i <= totalPages) pages.add(i)
    }
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const page of sorted) {
    if (prev && page - prev > 1) result.push('ellipsis')
    result.push(page)
    prev = page
  }
  return result
}
