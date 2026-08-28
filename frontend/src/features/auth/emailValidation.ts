const blockedDomains = new Set([
  'example.com',
  'example.net',
  'example.org',
  'test.com',
  'gm.com',
])

export function validateAccountEmail(value: string) {
  const email = value.trim().toLowerCase()
  const match = email.match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/)
  if (!match) return 'Enter a valid email address.'
  if (blockedDomains.has(match[1])) return 'Use a real business email address, not a test or placeholder domain.'
  return null
}
