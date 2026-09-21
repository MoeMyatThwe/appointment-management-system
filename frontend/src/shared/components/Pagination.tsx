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
    <div className="mt-5 flex flex-col gap-3 rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
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
      <div className="flex w-full gap-2 sm:w-auto">
        <button
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40 sm:flex-none"
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
        >
          Previous
        </button>
        <button
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40 sm:flex-none"
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
