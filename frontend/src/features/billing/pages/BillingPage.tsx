import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelSubscription, createSubscriptionCheckout, fetchPlans, fetchSubscription } from '../billingApi'

export function BillingPage() {
  const queryClient = useQueryClient()
  const subscription = useQuery({ queryKey: ['subscription'], queryFn: fetchSubscription })
  const plans = useQuery({ queryKey: ['plans'], queryFn: fetchPlans })
  const checkout = useMutation({
    mutationFn: createSubscriptionCheckout,
    onSuccess: ({ checkoutUrl }) => { window.location.assign(checkoutUrl) },
  })
  const cancel = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  })

  return <div className="mx-auto max-w-6xl">
    <div className="mb-8"><p className="text-sm font-semibold text-indigo-600">Workspace billing</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Subscription</h2><p className="mt-2 text-sm text-slate-500">Manage your SaaS plan. Appointment payments are separate.</p></div>
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Current plan</p><p className="mt-1 text-2xl font-bold text-slate-900">{subscription.data?.plan ?? 'Loading...'}</p><p className="mt-2 text-sm text-slate-500">Status: {subscription.data?.status ?? 'Loading...'}</p>{subscription.data?.status === 'ACTIVE' || subscription.data?.status === 'CANCEL_AT_PERIOD_END' ? <button className="mt-5 rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50" type="button" disabled={cancel.isPending} onClick={() => { if (window.confirm('Cancel this subscription at the end of the current billing period?')) cancel.mutate() }}>Cancel subscription</button> : null}</section>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.data?.map((plan) => <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" key={plan.code}><h3 className="text-lg font-bold text-slate-900">{plan.name}</h3><p className="mt-3 text-3xl font-bold text-slate-900">${(plan.monthlyPriceCents / 100).toFixed(0)}<span className="text-sm font-medium text-slate-500">/month</span></p><p className="mt-4 text-sm text-slate-500">{plan.staffLimit} staff · {plan.appointmentLimit.toLocaleString()} appointments</p>{plan.code === 'FREE' ? <span className="mt-6 inline-block text-sm font-semibold text-slate-500">No payment required</span> : <button className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700" type="button" disabled={checkout.isPending || subscription.data?.plan === plan.code} onClick={() => checkout.mutate(plan.code)}>{subscription.data?.plan === plan.code ? 'Current plan' : `Choose ${plan.name}`}</button>}</article>)}</div>
  </div>
}
