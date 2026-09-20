import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createService, fetchServicesPage } from '../servicesApi'
import { useListQueryState } from '../../../shared/hooks/useListQueryState'
import { SearchInput } from '../../../shared/components/SearchInput'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { Pagination } from '../../../shared/components/Pagination'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { FiPlus, FiX } from 'react-icons/fi'

export function ServicesPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [durationMinutes, setDuration] = useState('45')
  const [price, setPrice] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { state, setSearch, setFilter, getFilter, clear } = useListQueryState()
  const [searchInput, setSearchInput] = useState(state.search)
  const debouncedSearch = useDebouncedValue(searchInput)
  const [minDuration, setMinDuration] = useState(() => getFilter('minDuration'))
  const [maxDuration, setMaxDuration] = useState(() => getFilter('maxDuration'))
  const [minPrice, setMinPrice] = useState(() => getFilter('minPrice'))
  const [maxPrice, setMaxPrice] = useState(() => getFilter('maxPrice'))

  useEffect(() => { setSearch(debouncedSearch) }, [debouncedSearch, setSearch])
  useEscapeKey(showCreateModal, () => setShowCreateModal(false))

  const query = useQuery({
    queryKey: ['services', state.search, minDuration, maxDuration, state.sortBy, state.direction, state.page, state.pageSize],
    queryFn: () => fetchServicesPage({
      page: state.page,
      size: state.pageSize,
      query: state.search,
      minDuration,
      maxDuration,
      sortBy: state.sortBy || 'name',
      direction: state.direction,
    }),
  })
  const visibleServices = query.data?.content ?? []
  const sortedServices = { length: query.data?.totalElements ?? 0 }
  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      setName('')
      setDuration('45')
      setPrice('')
      setColor('#6366f1')
      setShowCreateModal(false)
      void qc.invalidateQueries({ queryKey: ['services'] })
    },
  })

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Your offerings</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Services</h2>
          <p className="mt-2 text-sm text-slate-500">Define what customers can book, how long it takes, and what it costs.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
          type="button"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus aria-hidden="true" />
          Add new service
        </button>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Your services</h3>
            <p className="mt-1 text-sm text-slate-500">{query.data?.totalElements ?? 0} result{query.data?.totalElements === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search services" />
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={state.sortBy} onChange={(event) => setFilter('sortBy', event.target.value)}>
              <option value="">Sort by name</option>
              <option value="duration">Sort by duration</option>
            </select>
            <input className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm" type="number" min="0" placeholder="Min min" value={minDuration} onChange={(event) => { setMinDuration(event.target.value); setFilter('minDuration', event.target.value) }} />
            <input className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm" type="number" min="0" placeholder="Max min" value={maxDuration} onChange={(event) => { setMaxDuration(event.target.value); setFilter('maxDuration', event.target.value) }} />
            <input className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm" type="number" min="0" placeholder="Min price" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setFilter('minPrice', event.target.value) }} />
            <input className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm" type="number" min="0" placeholder="Max price" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setFilter('maxPrice', event.target.value) }} />
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => { setMinDuration(''); setMaxDuration(''); setMinPrice(''); setMaxPrice(''); setSearchInput(''); clear(['search', 'minDuration', 'maxDuration', 'minPrice', 'maxPrice', 'page']) }}>Clear</button>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {query.isLoading ? <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Loading services...</p> : visibleServices.length ? visibleServices.map((service) => (
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-4" key={service.id}>
              <span className="h-10 w-2 rounded-full" style={{ backgroundColor: service.color ?? '#6366f1' }} />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{service.name}</p>
                <p className="mt-1 text-sm text-slate-500">{service.durationMinutes ?? 0} minutes · {service.price || 'Price not set'}</p>
              </div>
            </div>
          )) : <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No services found.</p>}
        </div>
        <Pagination page={state.page} totalPages={Math.ceil(sortedServices.length / state.pageSize)} totalElements={query.data?.totalElements} pageSize={state.pageSize} onPageChange={(page) => setFilter('page', page || undefined)} onPageSizeChange={(pageSize) => setFilter('pageSize', pageSize)} />
      </section>

      {showCreateModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreateModal(false) }}>
          <form
            data-tour="service-form"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={(event) => { event.preventDefault(); mutation.mutate({ name, durationMinutes: Number(durationMinutes), price, color }) }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-service-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-600">Your offerings</p>
                <h3 id="add-service-title" className="mt-1 text-xl font-bold text-slate-900">Add a service</h3>
              </div>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" type="button" aria-label="Close add service dialog" onClick={() => setShowCreateModal(false)}>
                <FiX aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <input className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Service name" value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <input className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="number" min="1" value={durationMinutes} onChange={(event) => setDuration(event.target.value)} placeholder="Minutes" />
                <input className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Price" value={price} onChange={(event) => setPrice(event.target.value)} />
              </div>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">Calendar color <input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>
              <div className="flex justify-end gap-2">
                <button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700" type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit" disabled={mutation.isPending}>
                  <FiPlus aria-hidden="true" />
                  {mutation.isPending ? 'Saving...' : 'Add service'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
