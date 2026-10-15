import { describe, expect, it } from 'vitest'
import { validateUstg14, lineTotals, taxBreakdown, retentionNoteFor } from './ustg14'
import { defaultInvoiceDraft } from './testData'
import type { CompanyProfile, OfferLineItem, StoredOffer } from './types'
import { KLEINUNTERNEHMER_HINT, RETENTION_NOTE_PRIVATE_BAU } from './types'
import { validateCompanyProfile } from './companyProfile'

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

  it('blocks when quantity or description missing', () => {
    const offer = {
      ...baseOffer,
      lines: [{ ...baseOffer.lines[0], quantity: 0, description: '', confirmed: true }],
    }
    const issues = validateUstg14(offer, defaultInvoiceDraft(), offer.lines)
    expect(issues.some((i) => i.field === 'line.quantity')).toBe(true)
    expect(issues.some((i) => i.field === 'line.description')).toBe(true)
  })

  it('computes totals and tax breakdown (Entgelt je Steuersatz)', () => {
    const totals = lineTotals(baseOffer.lines as OfferLineItem[])
    expect(totals.net).toBe(20)
    expect(totals.tax).toBeCloseTo(3.8)
    expect(totals.gross).toBeCloseTo(23.8)
    const rows = taxBreakdown(baseOffer.lines)
    expect(rows).toEqual([{ rate: 19, net: 20, tax: expect.closeTo(3.8, 5) }])
  })

  it('requires retention note for private person + Bau/Grundstück', () => {
    const draft = {
      ...defaultInvoiceDraft(),
      buyerIsPrivatePerson: true,
      bauGrundstueckLeistung: true,
    }
    expect(retentionNoteFor(draft)).toBe(RETENTION_NOTE_PRIVATE_BAU)
  })

  it('names missing company profile fields', () => {
    const profile: CompanyProfile = {
      name: '',
      street: '',
      postCode: '',
      city: '',
      countryCode: 'DE',
      email: '',
      taxNumber: '',
      vatId: '',
      iban: '',
      bic: '',
      logoDataUrl: '',
      kleinunternehmer: false,
      contactName: '',
      contactPhone: '',
    }
    const issues = validateCompanyProfile(profile)
    expect(issues.map((i) => i.field)).toContain('profile.name')
    expect(issues.map((i) => i.field)).toContain('profile.taxOrVat')
  })

  it('exposes Kleinunternehmer hint text exactly', () => {
    expect(KLEINUNTERNEHMER_HINT).toBe('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.')
  })
})
