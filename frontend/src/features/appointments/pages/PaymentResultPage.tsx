import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi'
import { confirmStripePayment } from '../paymentsApi'
import { confirmCustomerPayment } from '../../customers/customerPortalApi'
import { useAuthStore } from '../../auth/authStore'

interface PaymentResultPageProps {
  cancelled?: boolean
}

export function PaymentResultPage({ cancelled = false }: PaymentResultPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const sessionId = searchParams.get('session_id')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(false)
  const role = useAuthStore((state) => state.user?.role)

  useEffect(() => {
    if (cancelled || !appointmentId) return
    const currentAppointmentId = appointmentId
    const confirm = role === 'CUSTOMER' ? confirmCustomerPayment : confirmStripePayment
    void confirm(currentAppointmentId, sessionId ?? '')
      .then((payment) => setConfirmed(payment.status === 'PAID'))
      .catch(() => setError(true))
  }, [appointmentId, cancelled, role, sessionId])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#18234a] px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${cancelled ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {cancelled ? <FiX aria-hidden="true" /> : <FiCheck aria-hidden="true" />}
        </div>
        <p className={`mt-5 text-sm font-semibold uppercase tracking-[0.16em] ${cancelled ? 'text-amber-700' : 'text-emerald-700'}`}>
          {cancelled ? 'Payment cancelled' : confirmed ? 'Payment successful' : 'Payment submitted'}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {cancelled ? 'Your payment was not completed' : confirmed ? 'Your payment has been recorded' : 'Your payment was received'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {cancelled
            ? 'You can return to the appointment and try Stripe checkout again.'
            : error
              ? 'Stripe received the payment, but the appointment could not be updated automatically. Refresh the appointments page shortly.'
              : confirmed
                ? 'The appointment now shows the payment as paid.'
                : 'Confirming the payment with Stripe...'}
        </p>
        {appointmentId ? <p className="mt-4 break-all rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Appointment: {appointmentId}</p> : null}
        <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#18234a] px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={() => navigate(role === 'CUSTOMER' ? '/customer-portal' : '/appointments')}>
          <FiArrowLeft aria-hidden="true" /> Back to appointments
        </button>
      </section>
    </main>
  )
}

export function PaymentCancelledPage() {
  return <PaymentResultPage cancelled />
}
