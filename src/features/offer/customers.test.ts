import { describe, expect, it } from 'vitest'
import { validateLeitweg } from './customers'
import { validateUstg14 } from './ustg14'
import { defaultInvoiceDraft } from './testData'
import type { StoredOffer } from './types'

const offer: StoredOffer = {
  id: 'o1',
  createdAt: 1,
  updatedAt: 1,
  captureKind: 'dictation',
  title: 'T',
  servicePeriodStart: '2026-01-01',
  servicePeriodEnd: '2026-01-02',
  synced: false,
  lines: [
    {
      id: 'l1',
      quantity: 1,
      unit: 'Stück',
      unitCode: 'H87',
      description: 'Leistung',
      unitPriceNet: 100,
      taxRate: 19,
      confirmed: true,
    },
  ],
}

describe('Leitweg-ID / öffentlicher Auftraggeber', () => {
  it('blocks export without Leitweg-ID', () => {
    expect(validateLeitweg({ publicBuyer: true, leitwegId: '' }).length).toBe(1)
    const draft = {
      ...defaultInvoiceDraft(),
      publicBuyer: true,
      leitwegId: '',
      buyerReference: '',
    }
    const issues = validateUstg14(offer, draft, offer.lines)
    expect(issues.some((i) => i.field === 'customer.leitwegId')).toBe(true)
  })

  it('accepts Leitweg-ID as BT-10', () => {
    expect(validateLeitweg({ publicBuyer: true, leitwegId: '991-12345-67' })).toEqual([])
  })
})
