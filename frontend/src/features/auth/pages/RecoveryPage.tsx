import { useState } from 'react'
import { Link } from 'react-router-dom'
import { httpClient } from '../../../shared/api/httpClient'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export function RecoveryPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  async function requestRecovery() {
    const { data } = await httpClient.post<{ message: string; developmentToken?: string }>('/auth/recovery/request', { email })
    setMessage(data.developmentToken ? `${data.message} Development token: ${data.developmentToken}` : data.message)
  }
  async function resetPassword() {
    await httpClient.post('/auth/recovery/reset', { token, newPassword: password })
    setMessage('Password reset complete. You can sign in now.')
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10"><section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl sm:p-10"><p className="text-sm font-semibold text-indigo-600">Account recovery</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Reset your password</h1><div className="mt-7 grid gap-4"><input className="rounded-lg border border-slate-300 px-3 py-2.5" type="email" placeholder="Account email" value={email} onChange={(event) => setEmail(event.target.value)} /><button className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white" type="button" onClick={() => void requestRecovery()}>Request recovery</button><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Recovery token" value={token} onChange={(event) => setToken(event.target.value)} /><span className="relative"><input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10" type={showPassword ? 'text' : 'password'} placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent p-1 text-slate-500 shadow-none hover:text-slate-700" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button></span><button className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700" type="button" onClick={() => void resetPassword()}>Reset password</button>{message ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{message}</p> : null}<Link className="text-center text-sm font-semibold text-indigo-600" to="/login">Back to sign in</Link></div></section></main>
}
