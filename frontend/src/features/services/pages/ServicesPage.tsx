import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createService, fetchServicesPage } from '../servicesApi'
import { useListQueryState } from '../../../shared/hooks/useListQueryState'
import { SearchInput } from '../../../shared/components/SearchInput'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { Pagination } from '../../../shared/components/Pagination'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { Dialog } from '../../../shared/components/Dialog'
import { FormField } from '../../../shared/components/FormField'
import { StatusBadge } from '../../../shared/components/StatusBadge'
import { useToast } from '../../../shared/components/ToastProvider'
import { getApiErrorMessage } from '../../../shared/api/apiError'
import { FiClock, FiDollarSign, FiList, FiPlus } from 'react-icons/fi'

function formatDuration(minutes?: number) {
  if (!minutes || minutes < 1) return 'Duration not set'
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (!hours) return `${remainingMinutes} min`
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
}

export function ServicesPage() {
  const qc = useQueryClient()
  const { showToast } = useToast()
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
  const averageDuration = useMemo(() => {
    const durations = visibleServices.map((service) => service.durationMinutes).filter((duration): duration is number => typeof duration === 'number' && duration > 0)
    return durations.length ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length) : 0
  }, [visibleServices])
  const pricedServices = useMemo(() => visibleServices.filter((service) => service.price?.trim()).length, [visibleServices])
  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      setName('')
      setDuration('45')
      setPrice('')
      setColor('#6366f1')
      setShowCreateModal(false)
      void qc.invalidateQueries({ queryKey: ['services'] })
      showToast('Service added successfully.', 'success')
    },
    onError: (error) => showToast(getApiErrorMessage(error), 'error'),
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
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

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={<FiList aria-hidden="true" />} label="Configured services" value={String(query.data?.totalElements ?? 0)} detail="Available in your catalog" />
        <SummaryCard icon={<FiClock aria-hidden="true" />} label="Average duration" value={averageDuration ? `${averageDuration} min` : '—'} detail="Based on this page" />
        <SummaryCard icon={<FiDollarSign aria-hidden="true" />} label="Pricing coverage" value={`${pricedServices}/${visibleServices.length || 0}`} detail="Services with a price" />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Service catalog</h3>
            <p className="mt-1 text-sm text-slate-500">Search, filter, and review what customers can book.</p>
          </div>
          <span className="text-sm font-medium text-slate-500">{query.data?.totalElements ?? 0} result{query.data?.totalElements === 1 ? '' : 's'}</span>
        </div>
        <div className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search services" />
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={state.sortBy} onChange={(event) => setFilter('sortBy', event.target.value)}>
            <option value="">Sort by name</option>
            <option value="duration">Sort by duration</option>
          </select>
          <input className="rounded-lg border border-slate-300 px-2 py-2 text-sm" type="number" min="0" placeholder="Min minutes" value={minDuration} onChange={(event) => { setMinDuration(event.target.value); setFilter('minDuration', event.target.value) }} />
          <input className="rounded-lg border border-slate-300 px-2 py-2 text-sm" type="number" min="0" placeholder="Max minutes" value={maxDuration} onChange={(event) => { setMaxDuration(event.target.value); setFilter('maxDuration', event.target.value) }} />
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 sm:col-span-2 lg:col-span-5 lg:justify-self-end" type="button" onClick={() => { setMinDuration(''); setMaxDuration(''); setSearchInput(''); clear(['search', 'minDuration', 'maxDuration', 'page']) }}>Clear filters</button>
        </div>
        <Pagination page={state.page} totalPages={Math.ceil(sortedServices.length / state.pageSize)} totalElements={query.data?.totalElements} pageSize={state.pageSize} onPageChange={(page) => setFilter('page', page || undefined)} onPageSizeChange={(pageSize) => setFilter('pageSize', pageSize)} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {query.isLoading ? <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Loading services...</p> : visibleServices.length ? visibleServices.map((service) => (
            <article className="min-w-0 rounded-xl bg-slate-50 p-4" key={service.id}>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: service.color ?? '#6366f1' }} aria-label={`Calendar color ${service.color ?? '#6366f1'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="truncate font-semibold text-slate-900">{service.name}</h4>
                    <StatusBadge label={service.durationMinutes && service.durationMinutes > 0 ? 'Ready to book' : 'Needs setup'} tone={service.durationMinutes && service.durationMinutes > 0 ? 'success' : 'warning'} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-white/60 px-3 py-2"><p className="text-xs text-slate-500">Calendar time</p><p className="mt-0.5 font-semibold text-slate-800">{formatDuration(service.durationMinutes)}</p></div>
                    <div className="rounded-lg bg-white/60 px-3 py-2"><p className="text-xs text-slate-500">Price</p><p className="mt-0.5 font-semibold text-slate-800">{service.price?.trim() || 'Not set'}</p></div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{service.durationMinutes && service.durationMinutes > 0 ? 'Customers can select this duration when booking.' : 'Add a duration before publishing this service.'}</p>
                </div>
              </div>
            </article>
          )) : <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 md:col-span-2">No services found. Try clearing filters or add a new service.</p>}
        </div>
      </section>

      <Dialog open={showCreateModal} title="Add a service" eyebrow="Your offerings" onClose={() => setShowCreateModal(false)}>
        <form data-tour="service-form" className="mt-5 grid gap-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ name, durationMinutes: Number(durationMinutes), price, color }) }}>
          <FormField label="Service name"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="e.g. Initial consultation" value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Duration"><input className="rounded-lg border border-slate-300 px-3 py-2.5" type="number" min="1" value={durationMinutes} onChange={(event) => setDuration(event.target.value)} /></FormField>
            <FormField label="Price" hint="Use your workspace currency"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="30.00" value={price} onChange={(event) => setPrice(event.target.value)} /></FormField>
          </div>
          <FormField label="Calendar color" hint="Helps staff scan the calendar quickly"><input className="h-10 w-16 rounded-lg border border-slate-300 p-1" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></FormField>
          <div className="flex justify-end gap-2 pt-2"><button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700" type="button" onClick={() => setShowCreateModal(false)}>Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit" disabled={mutation.isPending}><FiPlus aria-hidden="true" />{mutation.isPending ? 'Saving...' : 'Add service'}</button></div>
        </form>
      </Dialog>
    </div>
  )
}

function SummaryCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-slate-900">{value}</p>
        <p className="truncate text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  )
}
