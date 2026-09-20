import { describe, expect, it } from 'vitest'
import { buildListQueryParams } from '../hooks/useListQueryState'
import { filterList, sortAndPaginate } from './listQuery'

interface Item {
  name: string
  role: string
}

const state = {
  search: '',
  page: 1,
  pageSize: 2,
  sortBy: 'name',
  direction: 'asc' as const,
}

describe('list query helpers', () => {
  it('filters searchable text and custom fields', () => {
    const items: Item[] = [
      { name: 'Alice', role: 'Manager' },
      { name: 'Bob', role: 'Staff' },
    ]
    expect(filterList(items, 'alice', (item) => `${item.name} ${item.role}`)).toEqual([items[0]])
    expect(filterList(items, '', (item) => item.name, (item) => item.role === 'Staff')).toEqual([items[1]])
  })

  it('sorts and paginates consistently', () => {
    const result = sortAndPaginate(
      [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }],
      state,
      (left, right) => left.name.localeCompare(right.name),
    )
    expect(result.items).toEqual([{ name: 'Charlie' }])
    expect(result.totalPages).toBe(2)
  })

  it('builds URL-ready query parameters', () => {
    expect(buildListQueryParams({
      search: 'spa',
      page: 2,
      pageSize: 20,
      sortBy: 'name',
      direction: 'desc',
    }, { active: 'true' })).toEqual({
      active: 'true',
      search: 'spa',
      page: 2,
      pageSize: 20,
      sortBy: 'name',
      direction: 'desc',
    })
  })
})
