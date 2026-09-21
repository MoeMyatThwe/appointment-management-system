export interface PageGuide {
  title: string
  summary: string
  points: string[]
}

const guides: Record<string, PageGuide> = {
  '/platform': {
    title: 'Platform overview',
    summary: 'Monitor the platform-level workspaces and operational controls available to administrators.',
    points: ['Use this area for platform administration rather than day-to-day tenant scheduling.', 'Review workspace health and administrative information before making changes.', 'Use the navigation to open support access, settings, and audit history.'],
  },
  '/platform/settings': {
    title: 'Platform settings',
    summary: 'Manage platform-wide configuration that affects administration and support operations.',
    points: ['Review each setting before changing it because platform settings can affect multiple workspaces.', 'Prefer controlled, documented changes over frequent experimentation in production.', 'Use the audit log to trace important administrative changes.'],
  },
  '/platform/audit-log': {
    title: 'Platform audit log',
    summary: 'Review a chronological record of important platform and support actions.',
    points: ['Use the log to verify who performed an action and when it occurred.', 'Filter or search for the relevant event before investigating a workspace issue.', 'Treat audit records as operational evidence and avoid modifying them unnecessarily.'],
  },
  '/platform/support': {
    title: 'Platform support access',
    summary: 'Review and manage support access requests across workspaces from the platform side.',
    points: ['Confirm the workspace, reason, requested duration, and current status before taking action.', 'Grant only the minimum access needed for a specific support task.', 'Use audit history to verify access decisions and follow-up activity.'],
  },
  '/dashboard': {
    title: 'Workspace overview',
    summary: 'Use the dashboard as your daily starting point for understanding what needs attention.',
    points: ['Review today’s and upcoming appointment counts at a glance.', 'Open the next appointment list for immediate schedule context.', 'Use the navigation to manage customers, services, staff, availability, and reports.'],
  },
  '/appointments': {
    title: 'Appointments',
    summary: 'Manage the complete appointment lifecycle, from booking through completion or cancellation.',
    points: ['Use search, filters, and date ranges to find a booking quickly.', 'Open an appointment to review details, reschedule it, change status, or record payment activity.', 'The list is paginated so large appointment volumes remain responsive.'],
  },
  '/calendar': {
    title: 'Calendar',
    summary: 'See availability visually and create or adjust appointments from open time slots.',
    points: ['Switch between day, week, and month views to match the planning task.', 'Select an open slot to create an appointment with the relevant customer, service, and staff member.', 'Use the full appointment list when a date range contains more bookings than the calendar preview shows.'],
  },
  '/customers': {
    title: 'Customer directory',
    summary: 'Keep customer contact details, notes, and appointment history in one searchable place.',
    points: ['Search before creating a customer to avoid duplicate records.', 'Store useful contact details and internal notes for consistent service.', 'Open a customer’s history before a visit to understand previous appointments and outcomes.'],
  },
  '/staff': {
    title: 'Staff management',
    summary: 'Organize team members and record when they are available to receive appointments.',
    points: ['Create a staff profile with the correct role and contact details.', 'Record time off so unavailable team members are excluded from booking availability.', 'Keep responsibilities and availability current before publishing appointment times.'],
  },
  '/services': {
    title: 'Service management',
    summary: 'Define what customers can book and how each service affects scheduling and pricing.',
    points: ['Set a clear service name, duration, price, and booking availability.', 'Use realistic durations so the calendar does not create overlapping or impractical slots.', 'Review active services regularly so the public booking page stays accurate.'],
  },
  '/resources': {
    title: 'Rooms and resources',
    summary: 'Track rooms, equipment, stations, or other shared resources required by appointments.',
    points: ['Create a resource with a clear name and location or usage description.', 'Assign resources only when they are genuinely needed to avoid unnecessary booking conflicts.', 'Keep shared resources current when rooms or equipment change.'],
  },
  '/schedule': {
    title: 'Business hours',
    summary: 'Set the hours and closures that determine when customers can book your business.',
    points: ['Select the working days and set opening and closing times in local business time.', 'Use Quick apply for common hours, then customize individual days when needed.', 'Add holidays and closures so unavailable dates cannot receive new appointments.'],
  },
  '/reports': {
    title: 'Reports and exports',
    summary: 'Review operational activity and export business data for analysis or record keeping.',
    points: ['Use the date range and filters to focus on the period or status you need.', 'Compare appointment and customer activity to identify workload and demand patterns.', 'Export only the data required for the task and handle downloaded files securely.'],
  },
  '/billing': {
    title: 'Subscription and billing',
    summary: 'Review the workspace plan, usage limits, and subscription management options.',
    points: ['Check the current plan and included limits before adding more workspace data.', 'Use the available billing action to change or manage the subscription.', 'Appointment payments and workspace subscription billing are separate concerns.'],
  },
  '/support-access': {
    title: 'Support access requests',
    summary: 'Control whether Schedora platform support may temporarily access your workspace.',
    points: ['Review who requested access, why it is needed, and how long it will last.', 'Approve only requests you recognize; approval grants temporary, time-limited access.', 'Decline unclear requests and use the audit log to review related activity when available.'],
  },
}

export function getPageGuide(pathname: string): PageGuide | null {
  const exactGuide = guides[pathname]
  if (exactGuide) return exactGuide
  if (pathname.startsWith('/book/')) return null
  return null
}
