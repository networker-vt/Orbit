import { describe, expect, it } from 'vitest'
import { buildEpcPayload, giroCodeFromInvoice } from './giroCode'
import { defaultInvoiceDraft } from './testData'
import type { CompanyProfile } from './types'

describe('GiroCode (EPC-QR)', () => {
  it('builds EPC payload with IBAN, amount, purpose', () => {
    const payload = buildEpcPayload({
      iban: 'DE89 3704 0044 0532 0130 00',
      bic: 'COBADEFFXXX',
      recipientName: 'Demo GmbH',
      amountEur: 23.8,
      purpose: 'RE-2026-0001',
    })
    expect(payload).toContain('BCD')
    expect(payload).toContain('DE89370400440532013000')
    expect(payload).toContain('EUR23.80')
    expect(payload).toContain('RE-2026-0001')
  })

  it('still builds QR for Kleinunternehmer (amount without USt)', () => {
    const profile: CompanyProfile = {
      name: 'Klein UG',
      street: 'Weg 1',
      postCode: '50667',
      city: 'Köln',
      countryCode: 'DE',
      email: 'a@example.com',
      taxNumber: '123',
      vatId: '',
      iban: 'DE89370400440532013000',
      bic: '',
      logoDataUrl: '',
      kleinunternehmer: true,
      contactName: '',
      contactPhone: '',
    }
    const draft = { ...defaultInvoiceDraft(), kleinunternehmer: true, iban: profile.iban }
    const payload = giroCodeFromInvoice(draft, 10, profile)
    expect(payload).toContain('EUR10.00')
    expect(payload).toContain('DE89370400440532013000')
  })

  it('returns null for 0 € only', () => {
    const draft = { ...defaultInvoiceDraft(), kleinunternehmer: false }
    expect(giroCodeFromInvoice(draft, 0, null)).toBeNull()
  })
})
