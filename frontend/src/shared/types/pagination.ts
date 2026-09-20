export interface PageResponse<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface PageQuery {
  page?: number
  size?: number
  sortBy?: string
  direction?: 'asc' | 'desc'
  query?: string
}
