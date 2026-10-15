import { describe, expect, it } from 'vitest'
import { buildEpcPayload, giroCodeFromInvoice } from './giroCode'
import { defaultInvoiceDraft } from './testData'

describe('GiroCode (EPC-QR)', () => {
  it('builds EPC payload with IBAN, amount, purpose', () => {
    const payload = buildEpcPayload({
      iban: 'DE89 3704 0044 0532 0130 00',
      bic: 'COBADEFFXXX',
      recipientName: 'Demo GmbH',
      amountEur: 23.8,
      purpose: 'RE-2026-0001',
      kleinunternehmer: false,
    })
    expect(payload).toContain('BCD')
    expect(payload).toContain('DE89370400440532013000')
    expect(payload).toContain('EUR23.80')
    expect(payload).toContain('RE-2026-0001')
  })

  it('returns null for Kleinunternehmer', () => {
    expect(
      buildEpcPayload({
        iban: 'DE89370400440532013000',
        bic: '',
        recipientName: 'X',
        amountEur: 10,
        purpose: 'RE-1',
        kleinunternehmer: true,
      }),
    ).toBeNull()
  })

  it('returns null for 0 €', () => {
    const draft = { ...defaultInvoiceDraft(), kleinunternehmer: false }
    expect(giroCodeFromInvoice(draft, 0, null)).toBeNull()
  })
})
