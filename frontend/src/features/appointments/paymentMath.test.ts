import { describe, expect, it } from 'vitest'
import { applyPayment } from './paymentMath'

describe('appointment payment calculations', () => {
  it('accumulates deposits and reports the remaining balance', () => {
    expect(applyPayment(100, 25, 30)).toEqual({
      amountPaid: 55,
      balance: 45,
      status: 'PARTIALLY_PAID',
    })
  })

  it('marks a fully paid appointment as paid', () => {
    expect(applyPayment(100, 75, 25).status).toBe('PAID')
  })

  it('rejects payments above the remaining balance', () => {
    expect(() => applyPayment(100, 75, 26)).toThrow(
      'Payment cannot exceed the remaining appointment balance',
    )
  })
})
