import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createStaff, deleteStaff, fetchStaff, updateStaff } from '../staffApi'
import type { Staff } from '../types'

const emptyForm = { name: '', email: '', role: '' }

export function StaffPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const query = useQuery({ queryKey: ['staff'], queryFn: fetchStaff })
  const createMutation = useMutation({ mutationFn: createStaff, onSuccess: () => { setForm(emptyForm); void queryClient.invalidateQueries({ queryKey: ['staff'] }) } })
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: typeof emptyForm }) => updateStaff(id, input), onSuccess: () => { setEditingStaff(null); setForm(emptyForm); void queryClient.invalidateQueries({ queryKey: ['staff'] }) } })
  const deleteMutation = useMutation({ mutationFn: deleteStaff, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['staff'] }) })
  const isSaving = createMutation.isPending || updateMutation.isPending

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingStaff) updateMutation.mutate({ id: editingStaff.id, input: form })
    else createMutation.mutate(form)
  }

  function edit(staff: Staff) {
    setEditingStaff(staff)
    setForm({ name: staff.name, email: staff.email ?? '', role: staff.role ?? '' })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">Team management</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Staff</h2>
        <p className="mt-2 text-sm text-slate-500">Add the people who provide your services and manage their workspace details.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <form className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" onSubmit={submit}>
          <h3 className="text-lg font-semibold text-slate-900">{editingStaff ? 'Edit staff member' : 'Add staff member'}</h3>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Full name<input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="e.g. May Thiri" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Email address <span className="font-normal text-slate-500">(optional)</span><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="staff@business.com" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Role <span className="font-normal text-slate-500">(optional)</span><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="e.g. Senior stylist" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label>
            <div className="flex gap-2 pt-2"><button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingStaff ? 'Update staff' : 'Add staff'}</button>{editingStaff ? <button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700" type="button" onClick={() => { setEditingStaff(null); setForm(emptyForm) }}>Cancel</button> : null}</div>
          </div>
        </form>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-900">Your team</h3><p className="mt-1 text-sm text-slate-500">{query.data?.length ?? 0} staff member{query.data?.length === 1 ? '' : 's'}</p></div></div>
          <div className="mt-5 grid gap-3">{query.isLoading ? <p className="text-sm text-slate-500">Loading staff...</p> : query.data?.length ? query.data.map((staff) => <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between" key={staff.id}><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">{staff.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{staff.name}</p><p className="mt-1 truncate text-sm text-slate-500">{staff.role || 'Role not set'} · {staff.email || 'Email not set'}</p></div></div><div className="flex shrink-0 gap-2"><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white" type="button" onClick={() => edit(staff)}>Edit</button><button className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" type="button" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Remove ${staff.name} from your team?`)) deleteMutation.mutate(staff.id) }}>Remove</button></div></div>) : <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No staff members yet. Add your first team member.</p>}</div>
        </section>
      </div>
    </div>
  )
}
