import { useState } from 'react'
import type { FormEvent } from 'react'
import { updateWorkspaceProfile } from '../../auth/authApi'
import { useAuthStore } from '../../auth/authStore'

const businessTypes = [
  ['SALON', 'Salon'],
  ['SPA', 'Spa or wellness'],
  ['BARBERSHOP', 'Barbershop'],
  ['CLINIC', 'Clinic or treatment'],
  ['STUDIO', 'Studio or coaching'],
  ['OTHER', 'Other business'],
]

export function OnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const [step, setStep] = useState(1)
  const [businessType, setBusinessType] = useState('SALON')
  const [otherBusinessType, setOtherBusinessType] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
  const [currency, setCurrency] = useState('USD')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return null
  }
  const workspaceUser = user

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await updateWorkspaceProfile({
        tenantName: workspaceUser.tenantName,
        businessType: businessType === 'OTHER' ? otherBusinessType.trim() : businessType,
        businessPhone,
        timezone,
        currency,
        onboardingCompleted: true,
      })
      setStep(3)
    } catch {
      setError('We could not save your workspace setup. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-indigo-600 px-7 py-8 text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">Workspace setup</p>
          <h1 className="mt-3 text-3xl font-bold">Set up {user.tenantName}</h1>
          <p className="mt-2 text-indigo-100">A few details help us make your appointment workspace useful from day one.</p>
          <div className="mt-6 flex gap-2" aria-label="Setup progress">
            {[1, 2, 3].map((item) => <span className={`h-2 flex-1 rounded-full ${item <= step ? 'bg-white' : 'bg-indigo-400'}`} key={item} />)}
          </div>
        </div>

        <div className="p-7 sm:p-10">
          {step === 1 ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-900">What kind of business do you run?</h2>
              <p className="mt-2 text-sm text-slate-500">We will use this to suggest the right setup for your team.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {businessTypes.map(([value, label]) => (
                  <button className={`rounded-2xl border px-4 py-4 text-left font-semibold transition ${businessType === value ? 'border-[#71809f] bg-[#71809f]/25 text-white ring-2 ring-[#71809f]/50' : 'border-slate-700/70 bg-slate-900/30 text-slate-300 hover:border-[#71809f]/70 hover:bg-[#71809f]/10'}`} key={value} type="button" onClick={() => setBusinessType(value)}>
                    {label}
                  </button>
                ))}
              </div>
              {businessType === 'OTHER' ? (
                <label className="mt-5 grid gap-1.5 text-sm font-semibold text-slate-300">
                  Tell us your business type
                  <input className="rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-3 font-normal text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30" value={otherBusinessType} onChange={(event) => setOtherBusinessType(event.target.value)} placeholder="For example, photography studio" required />
                </label>
              ) : null}
              <button className="mt-8 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => setStep(2)} disabled={businessType === 'OTHER' && !otherBusinessType.trim()}>Continue</button>
            </div>
          ) : null}

          {step === 2 ? (
            <form onSubmit={finish}>
              <h2 className="text-2xl font-bold text-slate-900">Business details</h2>
              <p className="mt-2 text-sm text-slate-500">These details help with booking confirmations and availability.</p>
              <div className="mt-7 grid gap-5">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Business phone <input className="rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="tel" autoComplete="tel" value={businessPhone} onChange={(event) => setBusinessPhone(event.target.value)} placeholder="+95 9 123 456 789" /></label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Time zone <select className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value={timezone}>{timezone}</option><option value="Asia/Yangon">Asia/Yangon</option><option value="Asia/Bangkok">Asia/Bangkok</option><option value="Asia/Singapore">Asia/Singapore</option><option value="UTC">UTC</option></select></label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Currency <select className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="USD">USD - US Dollar</option><option value="MMK">MMK - Myanmar Kyat</option><option value="THB">THB - Thai Baht</option><option value="SGD">SGD - Singapore Dollar</option></select></label>
                {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
                <div className="flex gap-3"><button className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => setStep(1)}>Back</button><button className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save and continue'}</button></div>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">Your workspace is ready</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Next, add your staff and services. Then you can start booking appointments.</p>
              <button className="mt-8 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => window.location.reload()}>Go to dashboard</button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
