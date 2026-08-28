import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResource, fetchResources } from '../resourcesApi'

export function ResourcesPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', resourceType: 'ROOM', description: '', capacity: '1' })
  const resourcesQuery = useQuery({ queryKey: ['resources'], queryFn: fetchResources })
  const createMutation = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      setForm({ name: '', resourceType: 'ROOM', description: '', capacity: '1' })
      void queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8"><p className="text-sm font-semibold text-indigo-600">Bookable resources</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Rooms and stations</h2><p className="mt-2 text-sm text-slate-500">Manage rooms, chairs, treatment beds, equipment, or other things that appointments require.</p></div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" onSubmit={(event) => { event.preventDefault(); createMutation.mutate({ ...form, capacity: Number(form.capacity), active: true }) }}>
          <h3 className="text-lg font-semibold text-slate-900">Add a resource</h3>
          <div className="mt-5 grid gap-4">
            <input className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Name, e.g. Treatment Room 1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })}><option value="ROOM">Room</option><option value="STATION">Station</option><option value="EQUIPMENT">Equipment</option><option value="LOCATION">Location</option><option value="OTHER">Other</option></select>
            <input className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} required />
            <textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Optional description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <button className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Add resource'}</button>
          </div>
        </form>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-semibold text-slate-900">Your resources</h3><div className="mt-5 grid gap-3">{resourcesQuery.data?.length ? resourcesQuery.data.map((resource) => <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4" key={resource.id}><div><p className="font-semibold text-slate-900">{resource.name}</p><p className="mt-1 text-sm text-slate-500">{resource.resourceType} · capacity {resource.capacity}</p>{resource.description ? <p className="mt-1 text-xs text-slate-500">{resource.description}</p> : null}</div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span></div>) : <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No rooms or stations added yet.</p>}</div></section>
      </div>
    </div>
  )
}
