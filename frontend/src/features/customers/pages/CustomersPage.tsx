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
import { Dialog } from '../../../shared/components/Dialog'
import { FormField } from '../../../shared/components/FormField'
import { useToast } from '../../../shared/components/ToastProvider'
import { getApiErrorMessage } from '../../../shared/api/apiError'
import { FiEdit2, FiPlus } from 'react-icons/fi'

const emptyForm = { name: '', email: '', phone: '', notes: '', customerGroup: '', tags: '' }

export function CustomersPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
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
  const createMutation = useMutation({ mutationFn: createCustomer, onSuccess: () => { setForm(emptyForm); setShowCustomerForm(false); void queryClient.invalidateQueries({ queryKey: ['customers'] }); showToast('Customer added successfully.', 'success') }, onError: (error) => showToast(getApiErrorMessage(error), 'error') })
  const updateMutation = useMutation({ mutationFn: ({ customerId, payload }: { customerId: string; payload: typeof emptyForm }) => updateCustomer(customerId, payload), onSuccess: () => { setEditingCustomer(null); setForm(emptyForm); setShowCustomerForm(false); void queryClient.invalidateQueries({ queryKey: ['customers'] }); showToast('Customer updated successfully.', 'success') }, onError: (error) => showToast(getApiErrorMessage(error), 'error') })
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
      <div className="grid gap-6">
        <Dialog open={showCustomerForm} title={editingCustomer ? 'Edit customer' : 'Add customer'} eyebrow="Customer relationships" onClose={() => setShowCustomerForm(false)}>
          <form data-tour="customer-form" className="mt-5 grid gap-3" onSubmit={onSubmit}>
            <FormField label="Full name"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required autoFocus /></FormField>
            <FormField label="Email address"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></FormField>
            <FormField label="Phone number"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></FormField>
            <FormField label="Customer group"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="e.g. VIP" value={form.customerGroup} onChange={(event) => setForm({ ...form, customerGroup: event.target.value })} /></FormField>
            <FormField label="Tags"><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Tags, separated by commas" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></FormField>
            <FormField label="Private notes"><textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Private notes and preferences" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField>
            <div className="flex justify-end gap-2 pt-2"><button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700" type="button" onClick={() => setShowCustomerForm(false)}>Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white" type="submit" disabled={isSubmitting}>{editingCustomer ? <FiEdit2 aria-hidden="true" /> : <FiPlus aria-hidden="true" />}{isSubmitting ? 'Saving...' : submitLabel}</button></div>
          </form>
        </Dialog>
        <section className="xl:col-span-2"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-slate-900">Customer directory</h3><div className="flex flex-wrap gap-2">        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search customers" /><select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={state.sortBy} onChange={(event) => setFilter('sortBy', event.target.value)}><option value="">Sort by name</option><option value="email">Sort by email</option></select><input className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Group" value={groupFilter} onChange={(event) => { setGroupFilter(event.target.value); setFilter('group', event.target.value) }} /><input className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Tag" value={tagFilter} onChange={(event) => { setTagFilter(event.target.value); setFilter('tag', event.target.value) }} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => {         setSearchInput(''); setGroupFilter(''); setTagFilter(''); clear(['search', 'group', 'tag', 'page']) }}>Clear</button></div></div>{customersQuery.isError ? <p className="mb-3 rounded-xl bg-rose-950/30 px-4 py-3 text-sm text-rose-200" role="alert">Customers could not be loaded. Refresh the page to try again.</p> : null}<p className="mb-3 text-sm text-slate-500">{customersQuery.isLoading ? 'Loading customers...' : `${customers.length} result${customers.length === 1 ? '' : 's'}`}</p><Pagination page={state.page} totalPages={Math.ceil(sortedCustomers.length / state.pageSize)} totalElements={customersQuery.data?.totalElements} pageSize={state.pageSize} onPageChange={(page) => setFilter('page', page || undefined)} onPageSizeChange={(pageSize) => setFilter('pageSize', pageSize)} /><div className="mt-3 grid gap-3">{customersQuery.isLoading ? <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading customers...</p> : visibleCustomers.length ? visibleCustomers.map((customer) => <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={customer.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{customer.name}</p><p className="mt-1 text-sm text-slate-500">{customer.email} · {customer.phone || 'No phone'}</p></div>{customer.customerGroup ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{customer.customerGroup}</span> : null}</div>{customer.tags ? <p className="mt-3 text-xs text-slate-500">Tags: {customer.tags}</p> : null}<div className="mt-4 flex gap-2">        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => { setEditingCustomer(customer); setForm({ name: customer.name, email: customer.email, phone: customer.phone ?? '', notes: customer.notes ?? '', customerGroup: customer.customerGroup ?? '', tags: customer.tags ?? '' }); setShowCustomerForm(true) }}>Edit</button>                <button data-tour="customer-history" className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700" type="button" onClick={() => { setHistoryPage(0); setHistoryCustomer(customer) }}>Appointment history</button></div></div>) : <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">No customers found.</p>}</div></section>
      </div>
      <Dialog open={Boolean(historyCustomer)} title={historyCustomer?.name ?? 'Customer history'} eyebrow="Customer history" onClose={() => setHistoryCustomer(null)}>
        <Pagination page={historyPage} totalPages={historyQuery.data?.totalPages ?? 0} totalElements={historyQuery.data?.totalElements} pageSize={historyPageSize} onPageChange={setHistoryPage} onPageSizeChange={(size) => { setHistoryPage(0); setHistoryPageSize(size) }} />
        <div className="mt-3 grid gap-3">{historyQuery.isLoading ? <p className="text-sm text-slate-500">Loading history...</p> : historyQuery.data?.content.length ? historyQuery.data.content.map((appointment) => <div className="rounded-xl bg-slate-50 p-4" key={appointment.id}><p className="font-semibold text-slate-800">{appointment.startTime || 'Date not set'}</p><p className="mt-1 text-sm text-slate-500">{appointment.status.replace('_', ' ')} · {appointment.notes || 'No notes'}</p></div>) : <p className="text-sm text-slate-500">No appointment history yet.</p>}</div>
      </Dialog>
    </div>
  )
}
