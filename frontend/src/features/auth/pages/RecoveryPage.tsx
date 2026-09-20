import { useState } from 'react'
import { Link } from 'react-router-dom'
import { httpClient } from '../../../shared/api/httpClient'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { getApiErrorMessage } from '../../../shared/api/apiError'

export function RecoveryPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function requestRecovery() {
    try {
      const { data } = await httpClient.post<{ message: string; developmentToken?: string }>('/auth/recovery/request', { email })
      setNotice({
        type: 'success',
        text: data.developmentToken
          ? `${data.message} Check your inbox and Spam/Junk folder. Development token: ${data.developmentToken}`
          : `${data.message} Check your inbox and Spam/Junk folder.`,
      })
    } catch (error) {
      setNotice({ type: 'error', text: getApiErrorMessage(error, 'recovery') })
    }
  }

  async function resetPassword() {
    try {
      await httpClient.post('/auth/recovery/reset', { token, newPassword: password })
      setNotice({ type: 'success', text: 'Password reset complete. You can sign in now.' })
    } catch (error) {
      setNotice({ type: 'error', text: getApiErrorMessage(error, 'recovery') })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
        <p className="text-sm font-semibold text-indigo-600">Account recovery</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Reset your password</h1>

        <form className="mt-7 grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Account email
            <input className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" type="email" name="email" autoComplete="email" placeholder="Account email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white" type="button" onClick={() => void requestRecovery()}>Request recovery</button>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Recovery token
            <input className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" type="text" name="recovery-token" autoComplete="off" spellCheck="false" placeholder="Paste the token from your email" value={token} onChange={(event) => setToken(event.target.value)} />
          </label>

          <div className="relative">
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent p-1 text-slate-500 shadow-none hover:text-slate-700" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
          </div>

          <button className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700" type="button" onClick={() => void resetPassword()}>Reset password</button>

          {notice ? (
            <p className={`rounded-lg p-3 text-sm ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {notice.text}
            </p>
          ) : null}

          <Link className="text-center text-sm font-semibold text-indigo-600" to="/login">Back to sign in</Link>
        </form>
      </section>
    </main>
  )
}
