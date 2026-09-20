function partsToObject(parts: Intl.DateTimeFormatPart[]) {
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
}

export function toDateTimeLocal(value: string, timezone: string) {
  const parts = partsToObject(new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value)))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function fromDateTimeLocal(value: string, timezone: string) {
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return value
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const wallTime = Date.UTC(year, month - 1, day, hour, minute)
  const offsetParts = partsToObject(new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(wallTime)))
  const timezoneWallTime = Date.UTC(
    Number(offsetParts.year),
    Number(offsetParts.month) - 1,
    Number(offsetParts.day),
    Number(offsetParts.hour),
    Number(offsetParts.minute),
    Number(offsetParts.second),
  )
  return new Date(wallTime - (timezoneWallTime - wallTime)).toISOString()
}

export function validateDateTimeRange(start: string, end: string) {
  if (!start || !end) return 'Choose both a start and end time.'
  if (end <= start) {
    return 'The end time must be after the start time.'
  }
  return null
}

export function formatAppointmentDateTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(value))
}

export function formatAppointmentTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(value))
}
