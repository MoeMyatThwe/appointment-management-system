import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PlatformHeader } from '../components/PlatformHeader'
import { fetchPlatformAuditEvents } from '../platformApi'
import type { PlatformAuditEvent } from '../platformApi'
import { Pagination } from '../../../shared/components/Pagination'
import type { PageResponse } from '../../../shared/types/pagination'

export function PlatformAuditLogPage() {
  const [tenantId, setTenantId] = useState('')
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const events = useQuery({ queryKey: ['platform-audit', tenantId, actor, action, page, pageSize], queryFn: () => fetchPlatformAuditEvents({ tenantId, actor, action, page, size: pageSize }) })
  const eventPage = Array.isArray(events.data) ? null : events.data as PageResponse<PlatformAuditEvent>
  const eventItems = Array.isArray(events.data) ? events.data : events.data?.content ?? []

  return (
    <>
      <PlatformHeader />
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-900 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mt-4 text-3xl font-bold text-white">Platform audit log</h1>
          <p className="mt-2 text-sm text-slate-400">Review administrative actions and support-access history.</p>

          <section className="mt-6 rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" role="search" aria-label="Audit log filters">
              <input className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Tenant ID" value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
              <input className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Actor email" value={actor} onChange={(event) => setActor(event.target.value)} />
              <select className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" value={action} onChange={(event) => setAction(event.target.value)}><option value="">All actions</option><option value="SUPPORT_ACCESS_REQUESTED">Support requested</option><option value="SUPPORT_ACCESS_APPROVED">Support approved</option><option value="SUPPORT_ACCESS_DECLINED">Support declined</option><option value="SUPPORT_ACCESS_REVOKED">Support revoked</option></select>
              <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => { setTenantId(''); setActor(''); setAction(''); setPage(0) }}>Clear</button>
            </div>
            <Pagination page={page} totalPages={eventPage?.totalPages ?? 0} totalElements={eventPage?.totalElements} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPage(0); setPageSize(size) }} />
            {events.isError ? <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert"><span>Audit events could not be loaded.</span><button className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100" type="button" onClick={() => void events.refetch()}>Retry</button></div> : null}
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[760px] w-full text-left text-sm">
                <caption className="sr-only">Platform audit events</caption>
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Time</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Tenant</th><th className="px-3 py-3">Details</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{events.isLoading ? <tr><td className="px-3 py-6 text-slate-500" colSpan={5}>Loading audit events...</td></tr> : eventItems.length ? eventItems.map((event) => <tr key={event.id}><td className="whitespace-nowrap px-3 py-3 text-slate-500">{new Date(event.createdAt).toLocaleString()}</td><td className="px-3 py-3 font-semibold text-slate-800">{event.action.replaceAll('_', ' ')}</td><td className="px-3 py-3 text-slate-600">{event.actorEmail}</td><td className="px-3 py-3 text-slate-600">{event.tenantId}</td><td className="px-3 py-3 text-slate-600">{event.details}</td></tr>) : <tr><td className="px-3 py-6 text-slate-500" colSpan={5}>No matching audit events.</td></tr>}</tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
