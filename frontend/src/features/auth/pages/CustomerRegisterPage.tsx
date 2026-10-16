import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../authStore'
import { FormField } from '../../../shared/components/FormField'

export function CustomerRegisterPage() {
  const { registerCustomer, isAuthenticated, isLoading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) return <Navigate to="/customer-portal" replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await registerCustomer({ email, password })
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-5 py-10">
    <form className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl" onSubmit={submit}>
      <p className="text-sm font-semibold text-indigo-600">Appointment SaaS</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Create your customer account</h1>
      <p className="mt-2 text-sm text-slate-500">Use one account to manage appointments with participating businesses.</p>
      <div className="mt-7 grid gap-4">
        <FormField label="Email" htmlFor="email"><input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></FormField>
        <FormField label="Password" htmlFor="password"><input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3" id="password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></FormField>
        {error ? <p className="rounded-xl bg-rose-50 px-3 py-3 text-sm text-rose-700">{error}</p> : null}
        <button className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white" type="submit" disabled={isLoading}>{isLoading ? 'Creating account...' : 'Create account'}</button>
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-indigo-600" to="/customer/login">Sign in</Link></p>
      <p className="mt-3 text-center text-sm text-slate-500">Running a business? <Link className="font-semibold text-indigo-600" to="/register">Create a workspace</Link></p>
    </form>
  </main>
}
