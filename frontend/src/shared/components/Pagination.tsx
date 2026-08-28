interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="mt-5 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
      <span className="text-slate-500">
        Page {page + 1} of {totalPages}
      </span>
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
          disabled={page === totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
