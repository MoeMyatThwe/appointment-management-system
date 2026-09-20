import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PlatformHeader } from '../components/PlatformHeader'
import { fetchPlatformTenants, fetchSupportAccess, requestSupportAccess, revokeSupportAccess } from '../platformApi'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { FiPlus, FiX } from 'react-icons/fi'

export function PlatformSupportPage() {
  const client = useQueryClient()
  const tenants = useQuery({ queryKey: ['platform-tenants'], queryFn: fetchPlatformTenants })
  const grants = useQuery({ queryKey: ['support-access'], queryFn: fetchSupportAccess })
  const [tenantId, setTenantId] = useState('')
  const [reason, setReason] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [showRequestModal, setShowRequestModal] = useState(false)
  useEscapeKey(showRequestModal, () => setShowRequestModal(false))
  const request = useMutation({ mutationFn: () => requestSupportAccess(tenantId, reason, durationMinutes), onSuccess: () => { setReason(''); setShowRequestModal(false); void client.invalidateQueries({ queryKey: ['support-access'] }) } })
  const revoke = useMutation({ mutationFn: revokeSupportAccess, onSuccess: () => void client.invalidateQueries({ queryKey: ['support-access'] }) })

  return (
    <>
      <PlatformHeader />
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-900 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="mt-4 text-3xl font-bold text-white">Audited support access</h1><p className="mt-2 text-sm text-slate-400">Request tenant consent before any support session is activated.</p></div><button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500" type="button" onClick={() => setShowRequestModal(true)}><FiPlus aria-hidden="true" />Request access</button></div>
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Support requests</h2>
            <div className="mt-4 grid gap-3">{grants.data?.length ? grants.data.map((grant) => <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between" key={grant.id}><div><p className="font-semibold">{grant.tenantId} · {grant.status}</p><p className="text-sm text-slate-500">{grant.reason} · {grant.durationMinutes} minutes</p></div>{grant.status === 'ACTIVE' && <button className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700" type="button" onClick={() => revoke.mutate(grant.id)}>Revoke</button>}</div>) : <p className="text-sm text-slate-500">No support requests.</p>}</div>
          </section>
        </div>
      </main>
      {showRequestModal ? <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRequestModal(false) }}><form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); request.mutate() }} role="dialog" aria-modal="true" aria-labelledby="request-access-title"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">Audited support access</p><h2 id="request-access-title" className="mt-1 text-xl font-bold">Request access</h2></div><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" aria-label="Close request access dialog" onClick={() => setShowRequestModal(false)}><FiX aria-hidden="true" /></button></div><div className="mt-5 grid gap-3"><select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={tenantId} onChange={(event) => setTenantId(event.target.value)} required autoFocus><option value="">Select tenant</option>{tenants.data?.map((tenant) => <option value={tenant.tenantId} key={tenant.tenantId}>{tenant.tenantName}</option>)}</select><input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} required /><input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="number" min={15} max={240} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} /><div className="flex justify-end gap-2"><button className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700" type="button" onClick={() => setShowRequestModal(false)}>Cancel</button><button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50" type="submit" disabled={!tenantId || !reason.trim() || request.isPending}>{request.isPending ? 'Requesting...' : 'Request consent'}</button></div></div></form></div> : null}
    </>
  )
}
