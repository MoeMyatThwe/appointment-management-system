import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface ListQueryDefaults {
  page?: number
  pageSize?: number
  sortBy?: string
  direction?: 'asc' | 'desc'
}

export interface ListQueryState {
  search: string
  page: number
  pageSize: number
  sortBy: string
  direction: 'asc' | 'desc'
}

export interface ListQueryControls {
  state: ListQueryState
  setSearch: (value: string) => void
  setFilter: (key: string, value: string | number | undefined) => void
  getFilter: (key: string) => string
  setPage: (page: number) => void
  setSort: (sortBy: string, direction?: 'asc' | 'desc') => void
  clear: (keys?: string[]) => void
}

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50]

export function useListQueryState(defaults: ListQueryDefaults = {}): ListQueryControls {
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useMemo<ListQueryState>(() => {
    const page = Number(searchParams.get('page'))
    const requestedPageSize = Number(searchParams.get('pageSize'))
    const direction = searchParams.get('direction')

    return {
      search: searchParams.get('search') ?? '',
      page: Number.isInteger(page) && page >= 0 ? page : defaults.page ?? 0,
      pageSize: PAGE_SIZE_OPTIONS.includes(requestedPageSize)
        ? requestedPageSize
        : defaults.pageSize ?? DEFAULT_PAGE_SIZE,
      sortBy: searchParams.get('sortBy') ?? defaults.sortBy ?? '',
      direction: direction === 'desc' ? 'desc' : defaults.direction ?? 'asc',
    }
  }, [defaults.direction, defaults.page, defaults.pageSize, defaults.sortBy, searchParams])

  const update = useCallback((changes: Record<string, string | number | undefined>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      Object.entries(changes).forEach(([key, value]) => {
        if (value === undefined || value === '') next.delete(key)
        else next.set(key, String(value))
      })
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setSearch = useCallback((value: string) => {
    update({ search: value.trim() || undefined, page: 0 })
  }, [update])

  const setFilter = useCallback((key: string, value: string | number | undefined) => {
    update({ [key]: value, page: 0 })
  }, [update])

  const getFilter = useCallback((key: string) => searchParams.get(key) ?? '', [searchParams])

  const setPage = useCallback((page: number) => {
    update({ page: page > 0 ? page : undefined })
  }, [update])

  const setSort = useCallback((sortBy: string, direction?: 'asc' | 'desc') => {
    update({
      sortBy: sortBy || undefined,
      direction: sortBy ? direction ?? 'asc' : undefined,
      page: 0,
    })
  }, [update])

  const clear = useCallback((keys?: string[]) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      const fields = keys ?? ['search', 'page', 'pageSize', 'sortBy', 'direction']
      fields.forEach((key) => next.delete(key))
      return next
    }, { replace: true })
  }, [setSearchParams])

  return { state, setSearch, setFilter, getFilter, setPage, setSort, clear }
}

export function buildListQueryParams(
  state: ListQueryState,
  filters: Record<string, string | number | undefined> = {},
) {
  return {
    ...filters,
    search: state.search || undefined,
    page: state.page,
    pageSize: state.pageSize,
    sortBy: state.sortBy || undefined,
    direction: state.sortBy ? state.direction : undefined,
  }
}
