import type { ListQueryState } from '../hooks/useListQueryState'

export function filterList<T>(
  items: T[],
  search: string,
  searchableText: (item: T) => string,
  matchesFilters: (item: T) => boolean = () => true,
) {
  const normalizedSearch = search.trim().toLowerCase()
  return items.filter((item) =>
    (!normalizedSearch || searchableText(item).toLowerCase().includes(normalizedSearch))
    && matchesFilters(item))
}

export function sortAndPaginate<T>(
  items: T[],
  state: ListQueryState,
  compare: (left: T, right: T, sortBy: string) => number,
) {
  const sorted = [...items].sort((left, right) => {
    const result = compare(left, right, state.sortBy)
    return state.direction === 'desc' ? -result : result
  })
  return {
    items: sorted.slice(state.page * state.pageSize, (state.page + 1) * state.pageSize),
    totalPages: Math.ceil(sorted.length / state.pageSize),
  }
}
