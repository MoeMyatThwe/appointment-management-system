import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiDownload } from 'react-icons/fi'
import { fetchCurrentTenantFlags } from '../../platform/platformApi'
import { downloadReportCsv, fetchReportSummary } from '../reportsApi'
import { useToast } from '../../../shared/components/ToastProvider'
import { getApiErrorMessage } from '../../../shared/api/apiError'

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const { showToast } = useToast()
  const flags = useQuery({ queryKey: ['current-tenant-flags'], queryFn: fetchCurrentTenantFlags })
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [exporting, setExporting] = useState<'appointments' | 'customers' | null>(null)
  const reportsEnabled = flags.data?.find((flag) => flag.key === 'REPORTS')?.enabled ?? true
  const summary = useQuery({
    queryKey: ['report-summary', from, to],
    queryFn: () => fetchReportSummary(from, to),
    enabled: reportsEnabled,
  })

  async function exportCsv(type: 'appointments' | 'customers') {
    setExporting(type)
    try {
      saveBlob(await downloadReportCsv(type, from, to), `${type}.csv`)
      showToast(`${type === 'appointments' ? 'Appointments' : 'Customers'} export downloaded.`, 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error')
    } finally {
      setExporting(null)
    }
  }

  if (flags.isSuccess && !reportsEnabled) {
    return <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p className="text-sm font-semibold text-amber-600">Feature unavailable</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Reports are disabled</h2><p className="mt-2 text-sm text-slate-500">Your platform administrator has disabled reports for this workspace.</p></div>
  }

  const metrics = summary.data
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8"><p className="text-sm font-semibold text-indigo-600">Business insights</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Reports & exports</h2><p className="mt-2 text-sm text-slate-500">Summaries are calculated by the server; exports use the selected date range.</p></div>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="font-semibold text-slate-900">Report period</h3><p className="mt-1 text-sm text-slate-500">Leave dates empty to include all appointments.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-semibold text-slate-600">From<input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="grid gap-1 text-xs font-semibold text-slate-600">To<input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></div></div>
      </section>
      {summary.isError ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">Report data could not be loaded. Adjust the period or try again.</div> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[['All appointments', metrics?.totalAppointments ?? 0], ['Upcoming', metrics?.upcomingAppointments ?? 0], ['Completed', metrics?.completedAppointments ?? 0], ['Cancelled', metrics?.cancelledAppointments ?? 0], ['Customers', metrics?.customerCount ?? 0]].map(([label, value]) => <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={label}><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{summary.isLoading ? '—' : value}</p></div>)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-semibold text-slate-900">Export data</h3><p className="mt-1 text-sm text-slate-500">Generate tenant-scoped files on the server.</p><div data-tour="reports-export" className="mt-5 grid gap-3 sm:grid-cols-2"><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50" type="button" disabled={Boolean(exporting)} onClick={() => void exportCsv('appointments')}><FiDownload aria-hidden="true" />{exporting === 'appointments' ? 'Preparing...' : 'Export appointments'}</button><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" type="button" disabled={Boolean(exporting)} onClick={() => void exportCsv('customers')}><FiDownload aria-hidden="true" />{exporting === 'customers' ? 'Preparing...' : 'Export customers'}</button></div></section>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-semibold text-slate-900">Service demand</h3><p className="mt-1 text-sm text-slate-500">Appointment totals for the selected period.</p><div className="mt-5 grid gap-3">{metrics?.serviceDemand.map((service) => <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3" key={service.serviceId}><span className="text-sm font-medium text-slate-700">{service.serviceName}</span><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">{service.appointmentCount}</span></div>)}{!metrics?.serviceDemand.length ? <p className="text-sm text-slate-500">No service demand for this period.</p> : null}</div></section>
      </div>
    </div>
  )
}
