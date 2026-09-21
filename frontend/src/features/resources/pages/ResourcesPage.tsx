import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResource, fetchResourcesPage } from '../resourcesApi'
import { useListQueryState } from '../../../shared/hooks/useListQueryState'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { SearchInput } from '../../../shared/components/SearchInput'
import { Pagination } from '../../../shared/components/Pagination'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { Dialog } from '../../../shared/components/Dialog'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/ToastProvider'
import { getApiErrorMessage } from '../../../shared/api/apiError'
import { FiPlus } from 'react-icons/fi'

export function ResourcesPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { state, setSearch, setFilter, clear } = useListQueryState()
  const [searchInput, setSearchInput] = useState(state.search)
  const search = useDebouncedValue(searchInput)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState({ name: '', resourceType: 'ROOM', description: '', capacity: '1' })

  useEffect(() => { setSearch(search) }, [search, setSearch])
  useEscapeKey(showCreateModal, () => setShowCreateModal(false))

  const resourcesQuery = useQuery({
    queryKey: ['resources', search, state.sortBy, state.direction, state.page, state.pageSize],
    queryFn: () => fetchResourcesPage({
      page: state.page,
      size: state.pageSize,
      query: search,
      sortBy: state.sortBy || 'name',
      direction: state.direction,
    }),
  })
  const resources = resourcesQuery.data?.content ?? []
  const mutation = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      setForm({ name: '', resourceType: 'ROOM', description: '', capacity: '1' })
      setShowCreateModal(false)
      void queryClient.invalidateQueries({ queryKey: ['resources'] })
      showToast('Resource added successfully.', 'success')
    },
    onError: (error) => showToast(getApiErrorMessage(error), 'error'),
  })

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Bookable resources</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Rooms and stations</h2>
          <p className="mt-2 text-sm text-slate-500">Manage rooms, chairs, treatment beds, equipment, or other things that appointments require.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => setShowCreateModal(true)}>
          <FiPlus aria-hidden="true" />Add new resource
        </button>
      </div>
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-lg font-semibold text-slate-900">Your resources</h3><p className="mt-1 text-sm text-slate-500">{resourcesQuery.data?.totalElements ?? 0} resource{resourcesQuery.data?.totalElements === 1 ? '' : 's'}</p></div>
          <div className="flex flex-wrap gap-2"><SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search resources" /><select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={state.sortBy} onChange={(event) => setFilter('sortBy', event.target.value)}><option value="">Sort by name</option><option value="resourceType">Sort by type</option><option value="capacity">Sort by capacity</option></select><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => { setSearchInput(''); clear(['search', 'page']) }}>Clear</button></div>
        </div>
        <Pagination page={state.page} totalPages={resourcesQuery.data?.totalPages ?? 0} totalElements={resourcesQuery.data?.totalElements} pageSize={state.pageSize} onPageChange={(page) => setFilter('page', page || undefined)} onPageSizeChange={(pageSize) => setFilter('pageSize', pageSize)} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{resourcesQuery.isLoading ? <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">Loading resources...</p> : resources.length ? resources.map((resource) => <article className="flex min-h-32 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-white hover:shadow-sm" key={resource.id}><div><div className="flex items-start justify-between gap-3"><h4 className="font-semibold leading-tight text-slate-900">{resource.name}</h4><span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span></div>{resource.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{resource.description}</p> : null}</div><div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-xs font-medium text-slate-500"><span>{resource.resourceType}</span><span>Capacity {resource.capacity}</span></div></article>) : <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">No resources match your filters.</p>}</div>
      </section>
      <Dialog open={showCreateModal} title="Add a resource" eyebrow="Bookable resources" onClose={() => setShowCreateModal(false)}>
        <form data-tour="resource-form" className="mt-5 grid gap-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ ...form, capacity: Number(form.capacity), active: true }) }}>
          <FormField label="Name"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Treatment Room 1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required autoFocus /></FormField>
          <FormField label="Type"><select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5" value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })}><option value="ROOM">Room</option><option value="STATION">Station</option><option value="EQUIPMENT">Equipment</option><option value="LOCATION">Location</option><option value="OTHER">Other</option></select></FormField>
          <FormField label="Capacity"><input className="rounded-lg border border-slate-300 px-3 py-2.5" type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} required /></FormField>
          <FormField label="Description" hint="Optional"><textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2.5" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField>
          <div className="flex justify-end gap-2"><button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700" type="button" onClick={() => setShowCreateModal(false)}>Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white" type="submit" disabled={mutation.isPending}><FiPlus aria-hidden="true" />{mutation.isPending ? 'Saving...' : 'Add resource'}</button></div>
        </form>
      </Dialog>
    </div>
  )
}
