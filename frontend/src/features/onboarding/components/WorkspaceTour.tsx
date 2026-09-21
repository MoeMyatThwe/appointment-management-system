import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheck, FiHelpCircle, FiX } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/authStore'

interface WorkspaceTourProps {
  request: number
}

interface TourStep {
  target: string
  route: string
  eyebrow: string
  title: string
  description: string
}

const seenKey = (tenantId: string) => `schedora-workspace-tour-seen:${tenantId}`

export function WorkspaceTour({ request }: WorkspaceTourProps) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const navigate = useNavigate()
  const canManageOperations = user?.role === 'TENANT_ADMIN' || user?.role === 'MANAGER'
  const canViewBilling = user?.role === 'TENANT_ADMIN'
  const canViewReports = user?.role === 'TENANT_ADMIN' || user?.role === 'MANAGER' || user?.role === 'STAFF'
  const [isOpen, setIsOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const steps = useMemo<TourStep[]>(() => {
    const commonSteps: TourStep[] = [
      {
        target: '[data-tour="dashboard-overview"]',
        route: '/dashboard',
        eyebrow: 'Start here',
        title: 'Your workspace at a glance',
        description: 'Use Overview to see today’s appointments, customers, staff, and services in one place.',
      },
      {
        target: '[data-tour="appointment-new"]',
        route: '/appointments',
        eyebrow: 'Step 1',
        title: 'Create an appointment',
        description: 'Choose a customer, service, team member, and time, then save the appointment.',
      },
      {
        target: '[data-tour="appointment-filters"]',
        route: '/appointments',
        eyebrow: 'Step 2',
        title: 'Find appointments quickly',
        description: 'Use filters and search to narrow appointments by date, status, customer, staff member, or service.',
      },
      {
        target: '[data-tour="appointment-details"]',
        route: '/appointments',
        eyebrow: 'Step 3',
        title: 'Open appointment actions',
        description: 'Open Details to review the booking, reschedule it, update its status, or record payment activity.',
      },
      {
        target: '[data-tour="calendar-create"]',
        route: '/calendar',
        eyebrow: 'Step 4',
        title: 'Book from the calendar',
        description: 'Select an open slot to create an appointment directly from the day, week, or month view.',
      },
      {
        target: '[data-tour="customer-form"]',
        route: '/customers',
        eyebrow: 'Step 5',
        title: 'Add customer details',
        description: 'Save contact information, groups, tags, and private notes so your team can serve customers consistently.',
      },
      {
        target: '[data-tour="customer-history"]',
        route: '/customers',
        eyebrow: 'Customer records',
        title: 'Review appointment history',
        description: 'Open a customer’s history to quickly understand previous visits and notes before a new appointment.',
      },
    ]

    if (canManageOperations) {
      commonSteps.push(
        {
          target: '[data-tour="staff-form"]',
          route: '/staff',
          eyebrow: 'Step 6',
          title: 'Add your team',
          description: 'Create staff profiles so appointments can be assigned to the right team member and their availability managed.',
        },
        {
          target: '[data-tour="staff-time-off"]',
          route: '/staff',
          eyebrow: 'Team availability',
          title: 'Block staff time off',
          description: 'Record leave or unavailable periods so the team member is not booked when they are away.',
        },
        {
          target: '[data-tour="service-form"]',
          route: '/services',
          eyebrow: 'Step 7',
          title: 'Create bookable services',
          description: 'Add the services customers can choose when they book online.',
        },
        {
          target: '[data-tour="resource-form"]',
          route: '/resources',
          eyebrow: 'Step 8',
          title: 'Add rooms and resources',
          description: 'Add rooms, stations, equipment, or locations that appointments may require.',
        },
        {
          target: '[data-tour="schedule-form"]',
          route: '/schedule',
          eyebrow: 'Step 9',
          title: 'Set business hours',
          description: 'Set weekly hours, breaks, and holidays so customers can only book available times.',
        },
      )
    }

    if (canViewBilling) {
      commonSteps.push({
        target: '[data-tour="billing-plans"]',
        route: '/billing',
        eyebrow: 'Workspace owner',
        title: 'Manage your subscription',
        description: 'Review plan limits and choose a subscription. Workspace billing is separate from appointment payments.',
      })
    }
    if (canViewReports) {
      commonSteps.push({
        target: '[data-tour="reports-export"]',
        route: '/reports',
        eyebrow: 'Measure progress',
        title: 'Export business data',
        description: 'Use reports to review appointment metrics and download appointment or customer CSV files.',
      })
    }
    if (canViewBilling) {
      commonSteps.push({
        target: '[data-tour="support-access"]',
        route: '/support-access',
        eyebrow: 'Security',
        title: 'Review support access',
        description: 'Approve or decline time-limited platform support requests for your workspace.',
      })
    }
    commonSteps.push(
      {
        target: '[data-tour="public-booking-nav"]',
        route: '/dashboard',
        eyebrow: 'Almost ready',
        title: 'Share your booking page',
        description: 'Open the public booking page to copy its link and let customers book with you online.',
      },
      {
        target: '[data-tour="workspace-help"]',
        route: '/dashboard',
        eyebrow: 'Any time',
        title: 'Replay this guide whenever you need it',
        description: 'Use Help in the sidebar to start this walkthrough again. You can also skip it at any time.',
      },
    )

    return commonSteps
  }, [canManageOperations, canViewBilling, canViewReports])

  useEffect(() => {
    if (!request) return
    setStepIndex(0)
    setIsOpen(true)
  }, [request])

  useEffect(() => {
    if (!isOpen) return
    const step = steps[stepIndex]
    if (step?.route && location.pathname !== step.route) {
      setTargetRect(null)
      navigate(step.route)
      return
    }

    const updateTarget = () => {
      const target = document.querySelector<HTMLElement>(step?.target ?? '')
      setTargetRect(target?.getBoundingClientRect() ?? null)
    }

    updateTarget()
    window.addEventListener('resize', updateTarget)
    window.addEventListener('scroll', updateTarget, true)
    return () => {
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget, true)
    }
  }, [isOpen, location.pathname, navigate, stepIndex, steps])

  useEffect(() => {
    if (!isOpen || location.pathname !== steps[stepIndex]?.route || targetRect || stepIndex >= steps.length - 1) return
    const findTarget = () => {
      const target = document.querySelector<HTMLElement>(steps[stepIndex].target)
      if (!target) return false
      setTargetRect(target.getBoundingClientRect())
      return true
    }
    const retryTimer = window.setInterval(findTarget, 100)
    const skipTimer = window.setTimeout(() => {
      window.clearInterval(retryTimer)
      if (!findTarget()) {
        setStepIndex((index) => Math.min(index + 1, steps.length - 1))
      }
    }, 3000)
    return () => {
      window.clearInterval(retryTimer)
      window.clearTimeout(skipTimer)
    }
  }, [isOpen, location.pathname, stepIndex, steps, targetRect])

  if (!isOpen || !steps[stepIndex]) return null

  const step = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1
  const tooltipStyle = targetRect
    ? {
        top: Math.min(targetRect.bottom + 18, window.innerHeight - 250),
        left: Math.min(Math.max(targetRect.left, 20), Math.max(20, window.innerWidth - 380)),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  const close = () => {
    if (user?.tenantId) localStorage.setItem(seenKey(user.tenantId), 'true')
    setIsOpen(false)
  }

  const next = () => {
    if (isLastStep) {
      close()
      return
    }
    setStepIndex((index) => index + 1)
  }

  return (
    <div className="workspace-tour" role="dialog" aria-label="Workspace guide" aria-modal="true">
      {targetRect ? (
        <div
          className="workspace-tour-spotlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      ) : null}
      <section className="workspace-tour-card" style={tooltipStyle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
            <FiHelpCircle aria-hidden="true" />
            {step.eyebrow}
          </div>
          <button className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white" type="button" aria-label="Close guide" onClick={close}>
            <FiX aria-hidden="true" />
          </button>
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-400">{stepIndex + 1} of {steps.length}</span>
          <div className="flex gap-2">
            <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white" type="button" onClick={close}>Skip</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400" type="button" onClick={next}>
              {isLastStep ? <FiCheck aria-hidden="true" /> : null}
              {isLastStep ? 'Done' : 'Next'}
              {!isLastStep ? <FiArrowRight aria-hidden="true" /> : null}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
