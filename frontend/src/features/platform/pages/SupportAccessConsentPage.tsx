import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consentSupportAccess, fetchTenantSupportAccess } from '../platformApi'
import { FiCheck, FiX } from 'react-icons/fi'

export function SupportAccessConsentPage() {
  const queryClient = useQueryClient()
  const requests = useQuery({ queryKey: ['tenant-support-access'], queryFn: fetchTenantSupportAccess })
  const consent = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => consentSupportAccess(id, approved),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tenant-support-access'] }),
  })

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">Security</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Support access requests</h2>
        <p className="mt-2 text-sm text-slate-500">Review and approve time-limited platform support access for your workspace.</p>
      </div>
      <section data-tour="support-access" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3">
          {requests.isLoading ? <p className="text-sm text-slate-500">Loading support requests...</p> : null}
          {requests.data?.length ? requests.data.map((request) => (
            <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between" key={request.id}>
              <div>
                <p className="font-semibold text-slate-900">{request.reason}</p>
                <p className="mt-1 text-sm text-slate-500">Requested by {request.requestedBy} · {request.durationMinutes} minutes</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{request.status.replaceAll('_', ' ')}</p>
              </div>
              {request.status === 'PENDING_CONSENT' ? (
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700" type="button" disabled={consent.isPending} onClick={() => consent.mutate({ id: request.id, approved: true })}><FiCheck aria-hidden="true" />Approve</button>
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white" type="button" disabled={consent.isPending} onClick={() => consent.mutate({ id: request.id, approved: false })}><FiX aria-hidden="true" />Decline</button>
                </div>
              ) : null}
            </div>
          )) : null}
          {!requests.isLoading && !requests.data?.length ? <p className="text-sm text-slate-500">No support access requests.</p> : null}
        </div>
      </section>
    </div>
  )
}
