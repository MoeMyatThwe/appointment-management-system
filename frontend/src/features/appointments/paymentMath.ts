export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID'

export function applyPayment(amountDue: number, amountPaid: number, amount: number) {
  if (amount < 0 || amountPaid + amount > amountDue) {
    throw new Error('Payment cannot exceed the remaining appointment balance')
  }
  const nextAmountPaid = amountPaid + amount
  const status: PaymentStatus = nextAmountPaid === 0
    ? 'UNPAID'
    : nextAmountPaid >= amountDue ? 'PAID' : 'PARTIALLY_PAID'
  return { amountPaid: nextAmountPaid, balance: Math.max(0, amountDue - nextAmountPaid), status }
}
