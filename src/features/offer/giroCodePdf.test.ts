import { describe, expect, it } from 'vitest'
import { exportZugferdPdf } from './einvoiceExport'
import { defaultInvoiceDraft } from './testData'
import type { CompanyProfile, StoredOffer } from './types'

const offer: StoredOffer = {
  id: 'o-pdf',
  createdAt: 1,
  updatedAt: 1,
  captureKind: 'dictation',
  title: 'PDF-Test',
  servicePeriodStart: '2026-01-01',
  servicePeriodEnd: '2026-01-02',
  synced: false,
  lines: [
    {
      id: 'l1',
      quantity: 1,
      unit: 'Stück',
      unitCode: 'H87',
      description: 'Testposition',
      unitPriceNet: 100,
      taxRate: 19,
      confirmed: true,
    },
  ],
}

const profile: CompanyProfile = {
  name: 'Demo Veranstaltungstechnik GmbH',
  street: 'Industrieweg 12',
  postCode: '50667',
  city: 'Köln',
  countryCode: 'DE',
  email: 'rechnung@demo-veranstaltung.example',
  taxNumber: '',
  vatId: 'DE123456789',
  iban: 'DE89370400440532013000',
  bic: 'COBADEFFXXX',
  logoDataUrl: '',
  kleinunternehmer: false,
  contactName: 'Service',
  contactPhone: '+49 221 0000000',
}

describe('ZUGFeRD PDF with GiroCode', () => {
  it('generates Factur-X PDF bytes with embedded QR (PDF/A-3 path)', async () => {
    const draft = defaultInvoiceDraft()
    const pdf = await exportZugferdPdf(offer, draft, offer.lines, profile)
    expect(pdf.byteLength).toBeGreaterThan(500)
    // PDF magic
    expect(String.fromCharCode(...pdf.slice(0, 4))).toBe('%PDF')
  }, 30000)
})
