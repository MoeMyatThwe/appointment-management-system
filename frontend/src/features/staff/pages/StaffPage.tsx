import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addStaffTimeOff, createStaff, deleteStaff, fetchStaffAppointmentsPage, fetchStaffPage, fetchStaffTimeOffPage, updateStaff } from '../staffApi'
import type { Staff } from '../types'
import { useListQueryState } from '../../../shared/hooks/useListQueryState'
import { SearchInput } from '../../../shared/components/SearchInput'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { Pagination } from '../../../shared/components/Pagination'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { FiEdit2, FiPlus, FiClock, FiX } from 'react-icons/fi'

const emptyForm = { name: '', email: '', role: '', active: true }

export function StaffPage() {
  const queryClient = useQueryClient()
  const { state, setSearch, setFilter, getFilter, clear } = useListQueryState()
  const [searchInput, setSearchInput] = useState(state.search)
  const debouncedSearch = useDebouncedValue(searchInput)
  const [roleFilter, setRoleFilter] = useState(() => getFilter('role'))
  useEffect(() => { setSearch(debouncedSearch) }, [debouncedSearch, setSearch])
  const [form, setForm] = useState(emptyForm)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [timeOffStaff, setTimeOffStaff] = useState<Staff | null>(null)
  const [appointmentPage, setAppointmentPage] = useState(0)
  const [timeOffPage, setTimeOffPage] = useState(0)
  const [historyPageSize, setHistoryPageSize] = useState(20)
  const [timeOff, setTimeOff] = useState({ startTime: '', endTime: '', reason: '' })
  useEscapeKey(showStaffForm, () => setShowStaffForm(false))
  const query = useQuery({
    queryKey: ['staff', state.search, roleFilter, state.sortBy, state.direction, state.page, state.pageSize],
    queryFn: () => fetchStaffPage({
      page: state.page, size: state.pageSize, query: state.search,
      role: roleFilter, sortBy: state.sortBy || 'name', direction: state.direction,
    }),
  })
  const filteredStaff = query.data?.content ?? []
  const sortedStaff = { length: query.data?.totalElements ?? 0 }
  const visibleStaff = filteredStaff
  const createMutation = useMutation({ mutationFn: createStaff, onSuccess: () => { setForm(emptyForm); setShowStaffForm(false); void queryClient.invalidateQueries({ queryKey: ['staff'] }) } })
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: typeof emptyForm }) => updateStaff(id, input), onSuccess: () => { setEditingStaff(null); setForm(emptyForm); setShowStaffForm(false); void queryClient.invalidateQueries({ queryKey: ['staff'] }) } })
  const deleteMutation = useMutation({ mutationFn: deleteStaff, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['staff'] }) })
  const appointmentsQuery = useQuery({
    queryKey: ['staff-appointments', timeOffStaff?.id, appointmentPage, historyPageSize],
    queryFn: () => fetchStaffAppointmentsPage(timeOffStaff!.id, appointmentPage, historyPageSize),
    enabled: Boolean(timeOffStaff),
  })
  const timeOffQuery = useQuery({
    queryKey: ['staff-time-off', timeOffStaff?.id, timeOffPage, historyPageSize],
    queryFn: () => fetchStaffTimeOffPage(timeOffStaff!.id, timeOffPage, historyPageSize),
    enabled: Boolean(timeOffStaff),
  })
  const timeOffMutation = useMutation({ mutationFn: () => addStaffTimeOff(timeOffStaff!.id, timeOff), onSuccess: () => { setTimeOff({ startTime: '', endTime: '', reason: '' }); void queryClient.invalidateQueries({ queryKey: ['staff-time-off', timeOffStaff?.id] }) } })
  const isSaving = createMutation.isPending || updateMutation.isPending

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingStaff) updateMutation.mutate({ id: editingStaff.id, input: form })
    else createMutation.mutate(form)
  }

  function edit(staff: Staff) {
    setEditingStaff(staff)
    setForm({ name: staff.name, email: staff.email ?? '', role: staff.role ?? '', active: staff.active !== false })
    setShowStaffForm(true)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">Team management</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Staff</h2>
        <div className="flex flex-wrap items-end justify-between gap-4"><p className="mt-2 text-sm text-slate-500">Add the people who provide your services and manage their workspace details.</p><button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => { setEditingStaff(null); setForm(emptyForm); setShowStaffForm(true) }}><FiPlus aria-hidden="true" />Add staff member</button></div>
      </div>
      <div>
        {showStaffForm ? <div className="fixed inset-0 z-30 bg-slate-950/50" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowStaffForm(false) }} /> : null}
        <form data-tour="staff-form" className={showStaffForm ? 'fixed inset-x-4 top-4 z-40 mx-auto max-h-[calc(100vh-2rem)] w-auto max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:top-8 sm:max-h-[calc(100vh-4rem)]' : 'hidden'} onSubmit={submit} role={showStaffForm ? 'dialog' : undefined} aria-modal={showStaffForm ? true : undefined} aria-labelledby={showStaffForm ? 'staff-form-title' : undefined}>
          <div className="flex items-start justify-between gap-4"><h3 id="staff-form-title" className="text-lg font-semibold text-slate-900">{editingStaff ? 'Edit staff member' : 'Add staff member'}</h3><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" aria-label="Close staff dialog" onClick={() => setShowStaffForm(false)}><FiX aria-hidden="true" /></button></div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Full name<input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="e.g. May Thiri" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Email address <span className="font-normal text-slate-500">(optional)</span><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="staff@business.com" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Role <span className="font-normal text-slate-500">(optional)</span><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="e.g. Senior stylist" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label>
            {editingStaff ? <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Available for new appointments</label> : null}
            <div className="flex justify-end gap-2 pt-2"><button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700" type="button" onClick={() => setShowStaffForm(false)}>Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit" disabled={isSaving}>{editingStaff ? <FiEdit2 aria-hidden="true" /> : <FiPlus aria-hidden="true" />}{isSaving ? 'Saving...' : editingStaff ? 'Update staff' : 'Add staff'}</button></div>
          </div>
        </form>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-900">Your team</h3><p className="mt-1 text-sm text-slate-500">{filteredStaff.length} staff member{filteredStaff.length === 1 ? '' : 's'}</p></div><div className="flex flex-wrap gap-2">          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search staff" /><select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={state.sortBy} onChange={(event) => setFilter('sortBy', event.target.value)}><option value="">Sort by name</option><option value="role">Sort by role</option></select><input className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Role" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setFilter('role', event.target.value) }} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button"           onClick={() => { setSearchInput(''); setRoleFilter(''); clear(['search', 'role', 'page']) }}>Clear</button></div></div>
          <div className="mt-5 grid gap-3">{query.isError ? <p className="rounded-xl bg-rose-950/30 px-4 py-3 text-sm text-rose-200" role="alert">Staff could not be loaded. Refresh the page to try again.</p> : query.isLoading ? <p className="text-sm text-slate-500">Loading staff...</p> : filteredStaff.length ?           visibleStaff.map((staff) => <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between" key={staff.id}><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">{staff.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{staff.name}</p>          <p className="mt-1 truncate text-sm text-slate-500">{staff.role || 'Role not set'} · {staff.email || 'Email not set'}{staff.active === false ? ' · Archived' : ''}</p></div></div>          <div className="flex shrink-0 gap-2">                    <button data-tour="staff-time-off" className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700" type="button" onClick={() => { setAppointmentPage(0); setTimeOffPage(0); setHistoryPageSize(20); setTimeOffStaff(staff) }}><FiClock aria-hidden="true" />View history</button><button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white" type="button" onClick={() => edit(staff)}><FiEdit2 aria-hidden="true" />Edit</button><button className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" type="button" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Remove ${staff.name} from your team?`)) deleteMutation.mutate(staff.id) }}>Remove</button></div></div>) : <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No staff members yet. Add your first team member.</p>}</div>
        </section>
      </div><Pagination page={state.page} totalPages={Math.ceil(sortedStaff.length / state.pageSize)} totalElements={query.data?.totalElements} pageSize={state.pageSize} onPageChange={(page) => setFilter('page', page || undefined)} onPageSizeChange={(pageSize) => setFilter('pageSize', pageSize)} />
      {timeOffStaff ? <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/50 p-5" role="dialog" aria-modal="true"><section className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-indigo-600">Staff history</p><h3 className="mt-1 text-xl font-bold text-slate-900">{timeOffStaff.name}</h3></div><button className="text-sm font-semibold text-slate-500" type="button" onClick={() => setTimeOffStaff(null)}>Close</button></div><form className="mt-5 grid gap-3" onSubmit={(event) => { event.preventDefault(); timeOffMutation.mutate() }}><input className="rounded-lg border border-slate-300 px-3 py-2.5" type="datetime-local" value={timeOff.startTime} onChange={(event) => setTimeOff({ ...timeOff, startTime: event.target.value })} required /><input className="rounded-lg border border-slate-300 px-3 py-2.5" type="datetime-local" min={timeOff.startTime || undefined} value={timeOff.endTime} onChange={(event) => setTimeOff({ ...timeOff, endTime: event.target.value })} required /><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Reason (optional)" value={timeOff.reason} onChange={(event) => setTimeOff({ ...timeOff, reason: event.target.value })} /><button className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white" type="submit" disabled={timeOffMutation.isPending}>{timeOffMutation.isPending ? 'Saving...' : 'Add time off'}</button></form><div className="mt-6"><h4 className="font-semibold text-slate-900">Upcoming and past appointments</h4><div className="mt-2 grid gap-2">{appointmentsQuery.isLoading ? <p className="text-sm text-slate-500">Loading appointments...</p> : appointmentsQuery.data?.content.length ? appointmentsQuery.data.content.map((item) => <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm" key={item.id}><p className="font-semibold text-slate-800">{item.startTime}</p><p className="text-slate-500">{item.status.replace('_', ' ')}</p></div>) : <p className="text-sm text-slate-500">No appointments recorded.</p>}</div><Pagination page={appointmentPage} totalPages={appointmentsQuery.data?.totalPages ?? 0} onPageChange={setAppointmentPage} /></div><div className="mt-6"><h4 className="font-semibold text-slate-900">Time off</h4><div className="mt-2 grid gap-2">{timeOffQuery.isLoading ? <p className="text-sm text-slate-500">Loading time off...</p> : timeOffQuery.data?.content.length ? timeOffQuery.data.content.map((item) => <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm" key={item.id}>{item.startTime} - {item.endTime}{item.reason ? ` · ${item.reason}` : ''}</div>) : <p className="text-sm text-slate-500">No time off recorded.</p>}</div><Pagination page={timeOffPage} totalPages={timeOffQuery.data?.totalPages ?? 0} onPageChange={setTimeOffPage} /></div></section></div> : null}
    </div>
  )
}
