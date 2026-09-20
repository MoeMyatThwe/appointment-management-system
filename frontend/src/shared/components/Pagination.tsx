interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  totalElements?: number
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export function Pagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalElements,
}: PaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) {
    return null
  }

  return (
    <div className="mt-5 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-4 text-slate-500">
        {totalElements !== undefined ? <span>{totalElements} result{totalElements === 1 ? '' : 's'}</span> : null}
        <span>Page {totalPages ? page + 1 : 0} of {totalPages}</span>
        {onPageSizeChange ? (
          <label className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-700"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex gap-2">
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40"
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
        >
          Previous
        </button>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40"
          type="button"
          disabled={totalPages === 0 || page === totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
