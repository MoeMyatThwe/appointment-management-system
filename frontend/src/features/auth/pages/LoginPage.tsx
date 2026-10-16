import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../authStore'
import { FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { FormField } from '../../../shared/components/FormField'

export function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuthStore()
  const location = useLocation()
  const customerLogin = location.pathname === '/customer/login'
  const returnTo = customerLogin ? new URLSearchParams(location.search).get('returnTo') : null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={customerLogin && returnTo?.startsWith('/') ? returnTo : customerLogin ? '/customer-portal' : '/dashboard'} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await login({ email, password }, customerLogin)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-5 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-[#18234a] p-10 text-white lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Appointment SaaS</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight">A calmer way to run your day.</h1>
          <p className="mt-5 max-w-md text-indigo-50">Manage bookings, customers, staff, and services from one simple workspace.</p>
        </div>
        <form className="p-7 sm:p-10" onSubmit={handleSubmit}>
          <p className="text-sm font-semibold text-indigo-600">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{customerLogin ? 'Sign in to your customer account' : 'Sign in to your workspace'}</h2>
          <p className="mt-2 text-sm text-slate-500">Use your account email and password to continue.</p>
          <div className="mt-4 flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1 text-sm">
            <Link className={`flex-1 rounded-lg px-3 py-2 text-center font-semibold ${customerLogin ? 'text-slate-500 hover:bg-white' : 'bg-white text-indigo-700 shadow-sm'}`} to="/login">Business/team</Link>
            <Link className={`flex-1 rounded-lg px-3 py-2 text-center font-semibold ${customerLogin ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white'}`} to="/customer/login">Customer</Link>
          </div>
          <div className="mt-7 grid gap-4">
            <FormField label="Email" htmlFor="email">
              <input className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" autoComplete="email" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </FormField>
            <FormField label="Password" htmlFor="password">
              <span className="relative"><input className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 pl-3 pr-10 py-3 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" autoComplete="current-password" id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required /><button className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-1 text-slate-500 shadow-none hover:text-slate-700" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button></span>
            </FormField>
        {error ? <p className="flex items-start gap-2 rounded-xl border border-rose-300/30 bg-rose-950/30 px-3 py-3 text-sm leading-5 text-rose-200"><FiAlertCircle className="mt-0.5 shrink-0 text-rose-300" size={18} aria-hidden="true" />{error}</p> : null}
        <button className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700" type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500"><Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/recovery">Forgot password?</Link></p>
          {customerLogin
            ? <p className="mt-3 text-center text-sm text-slate-500">New customer? <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/customer/register">Create an account</Link></p>
            : <p className="mt-3 text-center text-sm text-slate-500">New business? <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/register">Create a workspace</Link></p>}
        </form>
      </section>
    </main>
  )
}
