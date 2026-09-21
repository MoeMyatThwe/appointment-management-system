import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlatformHeader } from '../components/PlatformHeader'
import { exportPlatformTenant, fetchPlatformTenantsPage, fetchSubscriptionPlans, requestPlatformTenantDeletion, setPlatformTenantPlan, setPlatformTenantStatus } from '../platformApi'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { Pagination } from '../../../shared/components/Pagination'

export function PlatformAdminPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const search = useDebouncedValue(searchTerm)
  const tenantsQuery = useQuery({
    queryKey: ['platform-tenants', search, statusFilter, planFilter, page, pageSize],
    queryFn: () => fetchPlatformTenantsPage({ page, size: pageSize, search, status: statusFilter, plan: planFilter }),
  })
  const plansQuery = useQuery({ queryKey: ['platform-plans'], queryFn: fetchSubscriptionPlans })
  const tenants = tenantsQuery.data?.content ?? []
  useEffect(() => { setPage(0) }, [search, statusFilter, planFilter])
  const statusMutation = useMutation({ mutationFn: ({ tenantId, active }: { tenantId: string; active: boolean }) => setPlatformTenantStatus(tenantId, active), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['platform-tenants'] }) })
  const deletionMutation = useMutation({ mutationFn: requestPlatformTenantDeletion, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['platform-tenants'] }) })
  const planMutation = useMutation({ mutationFn: ({ tenantId, plan }: { tenantId: string; plan: string }) => setPlatformTenantPlan(tenantId, plan), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['platform-tenants'] }) })

  async function downloadTenantExport(tenantId: string) {
    const data = await exportPlatformTenant(tenantId)
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${tenantId}-account-export.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PlatformHeader />
      <main className="min-h-screen bg-slate-950 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="border-b border-slate-800 pb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">SaaS platform</p><h1 className="mt-2 text-3xl font-bold text-white">Platform administration</h1><p className="mt-2 text-sm text-slate-400">Manage tenant accounts without opening their operational data.</p></header>
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold text-slate-900">Tenant directory</h2><p className="mt-1 text-sm text-slate-500">Only the current page is loaded.</p></div><div className="text-sm text-slate-500">{tenantsQuery.data?.totalElements ?? 0} result{tenantsQuery.data?.totalElements === 1 ? '' : 's'}</div></div>
            <div className="mt-4 grid gap-3 border-b border-slate-200 pb-4 md:grid-cols-[1.4fr_0.8fr_0.8fr]"><label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Search by</span><input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Tenant name, email, or ID" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label><label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Account status</span><select className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DELETION_REQUESTED">Deletion requested</option></select></label><label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Plan</span><select className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}><option value="ALL">All plans</option>{plansQuery.data?.map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}</select></label></div>
            <Pagination page={page} totalPages={tenantsQuery.data?.totalPages ?? 0} totalElements={tenantsQuery.data?.totalElements} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPage(0); setPageSize(size) }} />
            <div className="mt-5 grid gap-3">{tenantsQuery.isLoading ? <p className="text-sm text-slate-500">Loading businesses...</p> : tenants.length ? tenants.map((tenant) => <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between" key={tenant.tenantId}><div><p className="font-semibold text-slate-900">{tenant.tenantName}</p><p className="mt-1 text-sm text-slate-500">{tenant.ownerEmail} · {tenant.businessType || 'Business type not set'}</p><p className="mt-1 text-xs text-slate-400">Tenant ID: {tenant.tenantId}</p><p className="mt-2 text-xs font-semibold text-indigo-700">{tenant.subscriptionPlan} · {tenant.subscriptionStatus}</p></div><div className="flex flex-wrap items-center gap-3"><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700" type="button" onClick={() => void downloadTenantExport(tenant.tenantId)}>Export</button><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tenant.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : tenant.accountStatus === 'DELETION_REQUESTED' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{tenant.accountStatus.replace('_', ' ')}</span>{plansQuery.data && tenant.accountStatus !== 'DELETION_REQUESTED' ? <select className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700" value={tenant.subscriptionPlan} disabled={planMutation.isPending} onChange={(event) => planMutation.mutate({ tenantId: tenant.tenantId, plan: event.target.value })}>{plansQuery.data.map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}</select> : null}{tenant.accountStatus !== 'DELETION_REQUESTED' ? <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700" type="button" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ tenantId: tenant.tenantId, active: !tenant.active })}>{tenant.active ? 'Suspend' : 'Activate'}</button> : null}{tenant.accountStatus === 'ACTIVE' ? <button className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700" type="button" disabled={deletionMutation.isPending} onClick={() => { if (window.confirm(`Request deletion for ${tenant.tenantName}?`)) deletionMutation.mutate(tenant.tenantId) }}>Request deletion</button> : null}</div></div>) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No tenants match your filters.</div>}</div>
          </section>
        </div>
      </main>
    </>
  )
}
