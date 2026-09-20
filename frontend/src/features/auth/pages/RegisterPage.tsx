import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { register } from '../authApi'
import { useAuthStore } from '../authStore'
import { validateAccountEmail } from '../emailValidation'
import { FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { getApiErrorMessage } from '../../../shared/api/apiError'

export function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [workspaceName, setWorkspaceName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const emailError = validateAccountEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }
    setIsSaving(true)
    try {
      await register({ workspaceName, email, password })
      try {
        await login({ email, password })
      } catch {
        throw new Error('Your workspace was created, but automatic sign-in failed. Please sign in manually.')
      }
      navigate('/dashboard')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'register'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-5 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-[#18234a] p-10 text-white lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Get started</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight">Run your appointments without the spreadsheets.</h1>
          <p className="mt-5 max-w-md text-indigo-50">Create a workspace for your salon, spa, or studio and start organizing customers, services, staff, and bookings in one place.</p>
        </div>
        <form className="p-7 sm:p-10" onSubmit={handleSubmit}>
          <p className="text-sm font-semibold text-indigo-600">Appointment SaaS</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your workspace</h2>
          <p className="mt-2 text-sm text-slate-500">You will become the workspace owner.</p>
          <div className="mt-7 grid gap-4">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Business name
              <input className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Aurora Beauty Studio" required />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Owner email
              <input className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@example.com" required />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Password
              <span className="relative"><input className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 pl-3 pr-10 py-3 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /><button className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-1 text-slate-500 shadow-none hover:text-slate-700" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button></span>
            </label>
            {error ? <p className="flex items-start gap-2 rounded-xl border border-rose-300/30 bg-rose-950/30 px-3 py-3 text-sm leading-5 text-rose-200"><FiAlertCircle className="mt-0.5 shrink-0 text-rose-300" size={18} aria-hidden="true" />{error}</p> : null}
            <button className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700" type="submit" disabled={isSaving}>
              {isSaving ? 'Creating workspace...' : 'Create workspace'}
            </button>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/login">Sign in</Link></p>
        </form>
      </section>
    </main>
  )
}
