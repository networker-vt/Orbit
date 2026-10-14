import { describe, expect, it } from 'vitest'
import { validateUstg14, lineTotals } from './ustg14'
import { defaultInvoiceDraft } from './testData'
import type { OfferLineItem, StoredOffer } from './types'

const baseOffer: StoredOffer = {
  id: 'o1',
  createdAt: 1,
  updatedAt: 1,
  captureKind: 'photo',
  title: 'Test',
  servicePeriodStart: '2026-01-01',
  servicePeriodEnd: '2026-01-31',
  synced: false,
  lines: [
    {
      id: 'l1',
      quantity: 2,
      unit: 'Stück',
      unitCode: 'H87',
      description: 'Kabel',
      unitPriceNet: 10,
      taxRate: 19,
      confirmed: true,
    },
  ],
}

describe('validateUstg14', () => {
  it('blocks export when tax rate missing', () => {
    const offer = {
      ...baseOffer,
      lines: [{ ...baseOffer.lines[0], taxRate: null, confirmed: true }],
    }
    const issues = validateUstg14(offer, defaultInvoiceDraft(), offer.lines)
    expect(issues.some((i) => i.field === 'line.taxRate')).toBe(true)
  })

  it('computes totals', () => {
    const totals = lineTotals(baseOffer.lines as OfferLineItem[])
    expect(totals.net).toBe(20)
    expect(totals.tax).toBeCloseTo(3.8)
    expect(totals.gross).toBeCloseTo(23.8)
  })
})
