import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCustomer, fetchCustomerAppointmentsPage, fetchCustomersPage, updateCustomer } from '../customersApi'
import type { Customer } from '../types'
import { useListQueryState } from '../../../shared/hooks/useListQueryState'
import { SearchInput } from '../../../shared/components/SearchInput'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { Pagination } from '../../../shared/components/Pagination'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { FiEdit2, FiPlus, FiX } from 'react-icons/fi'

const emptyForm = { name: '', email: '', phone: '', notes: '', customerGroup: '', tags: '' }

export function CustomersPage() {
  const queryClient = useQueryClient()
  const { state, setSearch, setFilter, getFilter, clear } = useListQueryState()
  const [searchInput, setSearchInput] = useState(state.search)
  const debouncedSearch = useDebouncedValue(searchInput)
  const [groupFilter, setGroupFilter] = useState(() => getFilter('group'))
  const [tagFilter, setTagFilter] = useState(() => getFilter('tag'))
  useEffect(() => { setSearch(debouncedSearch) }, [debouncedSearch, setSearch])
  const [form, setForm] = useState(emptyForm)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null)
  const [historyPage, setHistoryPage] = useState(0)
  const [historyPageSize, setHistoryPageSize] = useState(20)
  useEscapeKey(showCustomerForm, () => setShowCustomerForm(false))
  const customersQuery = useQuery({
    queryKey: ['customers', state.search, groupFilter, tagFilter, state.sortBy, state.direction, state.page, state.pageSize],
    queryFn: () => fetchCustomersPage({
      page: state.page,
      size: state.pageSize,
      query: state.search,
      group: groupFilter,
      tag: tagFilter,
      sortBy: state.sortBy || 'name',
      direction: state.direction,
    }),
  })
  const customers = customersQuery.data?.content ?? []
  const visibleCustomers = customers
  const sortedCustomers = { length: customersQuery.data?.totalElements ?? 0 }
  const historyQuery = useQuery({
    queryKey: ['customer-history', historyCustomer?.id, historyPage, historyPageSize],
    queryFn: () => fetchCustomerAppointmentsPage(historyCustomer!.id, historyPage, historyPageSize),
    enabled: Boolean(historyCustomer),
  })
  const createMutation = useMutation({ mutationFn: createCustomer, onSuccess: () => { setForm(emptyForm); setShowCustomerForm(false); void queryClient.invalidateQueries({ queryKey: ['customers'] }) } })
  const updateMutation = useMutation({ mutationFn: ({ customerId, payload }: { customerId: string; payload: typeof emptyForm }) => updateCustomer(customerId, payload), onSuccess: () => { setEditingCustomer(null); setForm(emptyForm); setShowCustomerForm(false); void queryClient.invalidateQueries({ queryKey: ['customers'] }) } })
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const submitLabel = useMemo(() => editingCustomer ? 'Update customer' : 'Add customer', [editingCustomer])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingCustomer) updateMutation.mutate({ customerId: editingCustomer.id, payload: form })
    else createMutation.mutate(form)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">Customer relationships</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Customers</h2><p className="mt-2 text-sm text-slate-500">Keep contact details, preferences, groups, and appointment history together.</p></div><button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => { setEditingCustomer(null); setForm(emptyForm); setShowCustomerForm(true) }}><FiPlus aria-hidden="true" />Add new customer</button></div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {showCustomerForm ? <div className="fixed inset-0 z-30 bg-slate-950/50" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCustomerForm(false) }} /> : null}<form data-tour="customer-form" className={showCustomerForm ? 'fixed inset-x-4 top-4 z-40 mx-auto max-h-[calc(100vh-2rem)] w-auto max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:top-8 sm:max-h-[calc(100vh-4rem)]' : 'hidden'} onSubmit={onSubmit} role={showCustomerForm ? 'dialog' : undefined} aria-modal={showCustomerForm ? true : undefined} aria-labelledby={showCustomerForm ? 'customer-form-title' : undefined}><div className="flex items-start justify-between gap-4"><h3 id="customer-form-title" className="text-lg font-semibold text-slate-900">{editingCustomer ? 'Edit customer' : 'Add customer'}</h3><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" aria-label="Close customer dialog" onClick={() => setShowCustomerForm(false)}><FiX aria-hidden="true" /></button></div><div className="mt-5 grid gap-3"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required autoFocus /><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Customer group, e.g. VIP" value={form.customerGroup} onChange={(event) => setForm({ ...form, customerGroup: event.target.value })} /><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Tags, separated by commas" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /><textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Private notes and preferences" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /><div className="flex justify-end gap-2"><button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700" type="button" onClick={() => setShowCustomerForm(false)}>Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white" type="submit" disabled={isSubmitting}>{editingCustomer ? <FiEdit2 aria-hidden="true" /> : <FiPlus aria-hidden="true" />}{isSubmitting ? 'Saving...' : submitLabel}</button></div></div></form>
        <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-slate-900">Customer directory</h3><div className="flex flex-wrap gap-2">        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search customers" /><select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={state.sortBy} onChange={(event) => setFilter('sortBy', event.target.value)}><option value="">Sort by name</option><option value="email">Sort by email</option></select><input className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Group" value={groupFilter} onChange={(event) => { setGroupFilter(event.target.value); setFilter('group', event.target.value) }} /><input className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Tag" value={tagFilter} onChange={(event) => { setTagFilter(event.target.value); setFilter('tag', event.target.value) }} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => {         setSearchInput(''); setGroupFilter(''); setTagFilter(''); clear(['search', 'group', 'tag', 'page']) }}>Clear</button></div></div>{customersQuery.isError ? <p className="mb-3 rounded-xl bg-rose-950/30 px-4 py-3 text-sm text-rose-200" role="alert">Customers could not be loaded. Refresh the page to try again.</p> : null}<p className="mb-3 text-sm text-slate-500">{customersQuery.isLoading ? 'Loading customers...' : `${customers.length} result${customers.length === 1 ? '' : 's'}`}</p><div className="grid gap-3">{customersQuery.isLoading ? <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading customers...</p> : visibleCustomers.length ? visibleCustomers.map((customer) => <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={customer.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{customer.name}</p><p className="mt-1 text-sm text-slate-500">{customer.email} · {customer.phone || 'No phone'}</p></div>{customer.customerGroup ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{customer.customerGroup}</span> : null}</div>{customer.tags ? <p className="mt-3 text-xs text-slate-500">Tags: {customer.tags}</p> : null}<div className="mt-4 flex gap-2">        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => { setEditingCustomer(customer); setForm({ name: customer.name, email: customer.email, phone: customer.phone ?? '', notes: customer.notes ?? '', customerGroup: customer.customerGroup ?? '', tags: customer.tags ?? '' }); setShowCustomerForm(true) }}>Edit</button>                <button data-tour="customer-history" className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700" type="button" onClick={() => { setHistoryPage(0); setHistoryCustomer(customer) }}>Appointment history</button></div></div>) : <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">No customers found.</p>}                </div><Pagination page={state.page} totalPages={Math.ceil(sortedCustomers.length / state.pageSize)} totalElements={customersQuery.data?.totalElements} pageSize={state.pageSize} onPageChange={(page) => setFilter('page', page || undefined)} onPageSizeChange={(pageSize) => setFilter('pageSize', pageSize)} /></section>
      </div>
      {historyCustomer ? <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/50 p-5" role="dialog" aria-modal="true"><section className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-indigo-600">Customer history</p><h3 className="mt-1 text-xl font-bold text-slate-900">{historyCustomer.name}</h3></div><button className="text-sm font-semibold text-slate-500" type="button" onClick={() => setHistoryCustomer(null)}>Close</button></div><div className="mt-5 grid gap-3">{historyQuery.isLoading ? <p className="text-sm text-slate-500">Loading history...</p> : historyQuery.data?.content.length ? historyQuery.data.content.map((appointment) => <div className="rounded-xl bg-slate-50 p-4" key={appointment.id}><p className="font-semibold text-slate-800">{appointment.startTime || 'Date not set'}</p><p className="mt-1 text-sm text-slate-500">{appointment.status.replace('_', ' ')} · {appointment.notes || 'No notes'}</p></div>) : <p className="text-sm text-slate-500">No appointment history yet.</p>}      <Pagination page={historyPage} totalPages={historyQuery.data?.totalPages ?? 0} totalElements={historyQuery.data?.totalElements} pageSize={historyPageSize} onPageChange={setHistoryPage} onPageSizeChange={(size) => { setHistoryPage(0); setHistoryPageSize(size) }} /></div></section></div> : null}
    </div>
  )
}
