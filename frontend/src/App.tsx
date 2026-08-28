import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import axios, { isAxiosError } from 'axios'
import './App.css'

type Appointment = {
  id: string
  businessId: string | null
  customerId: string | null
  staffId: string | null
  serviceId: string | null
  calendarId: string | null
  startTime: string | null
  endTime: string | null
  status: string | null
  notes: string | null
}

type AppointmentForm = {
  businessId: string
  customerId: string
  staffId: string
  serviceId: string
  calendarId: string
  startTime: string
  endTime: string
  status: string
  notes: string
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4004',
})

const emptyForm: AppointmentForm = {
  businessId: '',
  customerId: '',
  staffId: '',
  serviceId: '',
  calendarId: '',
  startTime: '',
  endTime: '',
  status: 'CONFIRMED',
  notes: '',
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [email, setEmail] = useState('testuser@test.com')
  const [password, setPassword] = useState('password123')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [form, setForm] = useState<AppointmentForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const logout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
    setAppointments([])
    setEditingId(null)
    setForm(emptyForm)
  }

  const loadAppointments = async (accessToken: string) => {
    setListLoading(true)
    try {
      const response = await api.get<Appointment[]>('/api/appointments', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setAppointments(response.data)
    } finally {
      setListLoading(false)
    }
  }

  const requestErrorMessage = (requestError: unknown, fallback: string) => {
    if (isAxiosError(requestError) && typeof requestError.response?.data?.message === 'string') {
      return requestError.response.data.message
    }
    return fallback
  }

  useEffect(() => {
    if (!token) {
      return
    }

    loadAppointments(token).catch((requestError) => {
      if (isAxiosError(requestError) && requestError.response?.status === 401) {
        logout()
        setError('Your session has expired. Please sign in again.')
      } else {
        setError('Unable to load appointments. Please try again.')
      }
    })
  }, [token])

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await api.post<{ token: string }>('/auth/login', {
        email,
        password,
      })
      localStorage.setItem('access_token', response.data.token)
      setToken(response.data.token)
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Unable to sign in with those credentials.'))
    } finally {
      setSaving(false)
    }
  }

  const saveAppointment = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) {
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingId) {
        await api.put(`/api/appointments/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await api.post('/api/appointments', form, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadAppointments(token)
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          editingId
            ? 'Unable to update the appointment. Check the form and try again.'
            : 'Unable to create the appointment. Check the form and try again.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const editAppointment = (appointment: Appointment) => {
    setEditingId(appointment.id)
    setForm({
      businessId: appointment.businessId ?? '',
      customerId: appointment.customerId ?? '',
      staffId: appointment.staffId ?? '',
      serviceId: appointment.serviceId ?? '',
      calendarId: appointment.calendarId ?? '',
      startTime: appointment.startTime?.slice(0, 16) ?? '',
      endTime: appointment.endTime?.slice(0, 16) ?? '',
      status: appointment.status ?? 'CONFIRMED',
      notes: appointment.notes ?? '',
    })
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const cancelAppointment = async (appointment: Appointment) => {
    if (!token) {
      return
    }

    setActionId(appointment.id)
    setError('')
    try {
      await api.put(
        `/api/appointments/${appointment.id}`,
        {
          businessId: appointment.businessId,
          customerId: appointment.customerId,
          staffId: appointment.staffId,
          serviceId: appointment.serviceId,
          calendarId: appointment.calendarId,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: 'CANCELLED',
          notes: appointment.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      await loadAppointments(token)
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Unable to cancel the appointment.'))
    } finally {
      setActionId(null)
    }
  }

  const deleteAppointment = async (id: string) => {
    if (!token || !window.confirm('Delete this appointment permanently?')) {
      return
    }

    setActionId(id)
    setError('')
    try {
      await api.delete(`/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (editingId === id) {
        cancelEdit()
      }
      await loadAppointments(token)
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Unable to delete the appointment.'))
    } finally {
      setActionId(null)
    }
  }

  if (!token) {
    return (
      <main className="page centered">
        <form className="card auth-card" onSubmit={login}>
          <p className="eyebrow">Appointment Management</p>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage appointments.</p>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={saving} type="submit">
            {saving ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Appointment Management</p>
          <h1>Appointments</h1>
        </div>
        <button className="secondary" onClick={logout} type="button">
          Sign out
        </button>
      </header>

      {error && <p className="error banner">{error}</p>}

      <section className="layout">
        <form className="card" onSubmit={saveAppointment}>
          <div className="section-heading">
            <h2>{editingId ? 'Edit appointment' : 'New appointment'}</h2>
            {editingId && (
              <button className="text-button" onClick={cancelEdit} type="button">
                Cancel edit
              </button>
            )}
          </div>
          <div className="grid">
            {(['businessId', 'customerId', 'staffId', 'serviceId', 'calendarId'] as const).map(
              (field) => (
                <label key={field}>
                  {field}
                  <input
                    value={form[field]}
                    onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                    required
                  />
                </label>
              ),
            )}
            <label>
              Start time
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                required
              />
            </label>
            <label>
              End time
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                required
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
          </div>
          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={3}
            />
          </label>
          <button disabled={saving} type="submit">
            {saving ? 'Saving...' : editingId ? 'Update appointment' : 'Create appointment'}
          </button>
        </form>

        <section className="card">
          <div className="section-heading">
            <h2>Upcoming records</h2>
            <span className="count">{appointments.length}</span>
          </div>
          {listLoading ? (
            <p className="muted">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p className="muted">No appointments found.</p>
          ) : (
            <div className="records">
              {appointments.map((appointment) => (
                <article className="record" key={appointment.id}>
                  <div>
                    <strong>{appointment.customerId ?? 'Unknown customer'}</strong>
                    <p className="muted">
                      {appointment.startTime ?? 'No start time'} ·{' '}
                      {appointment.status ?? 'No status'}
                    </p>
                    <div className="record-actions">
                      <button
                        className="secondary compact"
                        disabled={actionId !== null || saving}
                        onClick={() => editAppointment(appointment)}
                        type="button"
                      >
                        Edit
                      </button>
                      {appointment.status !== 'CANCELLED' && (
                        <button
                          className="warning compact"
                          disabled={actionId !== null || saving}
                          onClick={() => cancelAppointment(appointment)}
                          type="button"
                        >
                          {actionId === appointment.id ? 'Working...' : 'Cancel'}
                        </button>
                      )}
                      <button
                        className="danger compact"
                        disabled={actionId !== null || saving}
                        onClick={() => deleteAppointment(appointment.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <span className="record-id">{appointment.id.slice(0, 8)}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
