import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAppointments } from '../../appointments/appointmentsApi'
import { fetchCustomers } from '../../customers/customersApi'
import { fetchServices } from '../../services/servicesApi'
import { fetchCurrentTenantFlags } from '../../platform/platformApi'

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const flags = useQuery({ queryKey: ['current-tenant-flags'], queryFn: fetchCurrentTenantFlags })
  const reportsEnabled = flags.data?.find((flag) => flag.key === 'REPORTS')?.enabled ?? true
  const appointments = useQuery({ queryKey: ['appointments'], queryFn: () => fetchAppointments() })
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => fetchCustomers() })
  const services = useQuery({ queryKey: ['services'], queryFn: () => fetchServices() })
  if (flags.isSuccess && !reportsEnabled) {
    return <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p className="text-sm font-semibold text-amber-600">Feature unavailable</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Reports are disabled</h2><p className="mt-2 text-sm text-slate-500">Your platform administrator has disabled reports for this workspace.</p></div>
  }
  const records = appointments.data ?? []
  const metrics = useMemo(() => ({
    total: records.length,
    upcoming: records.filter((item) => item.startTime && item.startTime >= new Date().toISOString() && item.status !== 'CANCELLED').length,
    completed: records.filter((item) => item.status === 'COMPLETED').length,
    cancelled: records.filter((item) => item.status === 'CANCELLED').length,
  }), [records])

  function exportAppointments() {
    downloadCsv('appointments.csv', [
      ['Appointment ID', 'Customer ID', 'Staff ID', 'Service ID', 'Start', 'End', 'Status', 'Notes'],
      ...records.map((item) => [item.id, item.customerId, item.staffId, item.serviceId, item.startTime, item.endTime, item.status, item.notes ?? '']),
    ])
  }

  function exportCustomers() {
    downloadCsv('customers.csv', [
      ['Customer ID', 'Name', 'Email', 'Phone', 'Group', 'Tags', 'Notes'],
      ...(customers.data ?? []).map((item) => [item.id, item.name, item.email, item.phone ?? '', item.customerGroup ?? '', item.tags ?? '', item.notes ?? '']),
    ])
  }

  return <div className="mx-auto max-w-6xl"><div className="mb-8"><p className="text-sm font-semibold text-indigo-600">Business insights</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Reports & exports</h2><p className="mt-2 text-sm text-slate-500">Understand your workload and take your business data with you.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['All appointments', metrics.total], ['Upcoming', metrics.upcoming], ['Completed', metrics.completed], ['Cancelled', metrics.cancelled]].map(([label, value]) => <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={label}><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-semibold text-slate-900">Export data</h3><p className="mt-1 text-sm text-slate-500">Download tenant-scoped records for accounting or analysis.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700" type="button" onClick={exportAppointments}>Export appointments CSV</button><button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={exportCustomers}>Export customers CSV</button></div></section><section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-semibold text-slate-900">Service demand</h3><p className="mt-1 text-sm text-slate-500">Appointments grouped by configured service.</p><div className="mt-5 grid gap-3">{services.data?.map((service) => <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3" key={service.id}><span className="text-sm font-medium text-slate-700">{service.name}</span><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">{records.filter((item) => item.serviceId === service.id).length}</span></div>)}{!services.data?.length ? <p className="text-sm text-slate-500">Add services to see demand.</p> : null}</div></section></div></div>
}
