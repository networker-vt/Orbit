import { describe, expect, it } from 'vitest'
import {
  clearPublicBuyerFields,
  isValidLeitwegId,
  LEITWEG_CHECK_DIGIT_MSG,
  validateLeitweg,
} from './customers'
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

  it('accepts valid Leitweg-ID 991-12345-73 (BT-10)', () => {
    expect(isValidLeitwegId('991-12345-73')).toBe(true)
    expect(validateLeitweg({ publicBuyer: true, leitwegId: '991-12345-73' })).toEqual([])
  })

  it('rejects invalid check digit 991-12345-67 with exact message', () => {
    expect(isValidLeitwegId('991-12345-67')).toBe(false)
    const issues = validateLeitweg({ publicBuyer: true, leitwegId: '991-12345-67' })
    expect(issues).toEqual([{ field: 'customer.leitwegId', labelDe: LEITWEG_CHECK_DIGIT_MSG }])
    expect(issues[0]?.labelDe).toBe(
      'Prüfziffer stimmt nicht – bitte Leitweg-ID beim Auftraggeber prüfen',
    )
    const draft = {
      ...defaultInvoiceDraft(),
      publicBuyer: true,
      leitwegId: '991-12345-67',
      buyerReference: '991-12345-67',
    }
    const exportIssues = validateUstg14(offer, draft, offer.lines)
    expect(exportIssues.some((i) => i.labelDe === LEITWEG_CHECK_DIGIT_MSG)).toBe(true)
  })

  it('clears Leitweg-ID and BuyerReference when unchecking öffentlicher Auftraggeber', () => {
    const draft = {
      ...defaultInvoiceDraft(),
      publicBuyer: true,
      leitwegId: '991-12345-73',
      buyerReference: '991-12345-73',
    }
    const cleared = clearPublicBuyerFields(draft)
    expect(cleared.publicBuyer).toBe(false)
    expect(cleared.leitwegId).toBe('')
    expect(cleared.buyerReference).toBe('')
  })
})
