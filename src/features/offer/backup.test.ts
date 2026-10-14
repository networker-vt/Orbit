import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildBackupPayload,
  importBackupZip,
  normalizeBackupForCompare,
  roundTripBackupIdentical,
} from './backup'
import {
  getInvoiceCounter,
  mergeInvoiceCounter,
  saveCompanyProfile,
  saveInvoice,
  saveOffer,
  setBusinessConsentAccepted,
  setInvoiceCounterForTests,
} from './offerDb'
import type { CompanyProfile, StoredInvoice, StoredOffer } from './types'

vi.mock('./einvoiceExport', () => ({
  exportXRechnungXml: vi.fn(async () => '<xml/>'),
  exportZugferdPdf: vi.fn(async () => new Uint8Array([1, 2, 3])),
  downloadBlob: vi.fn(),
}))

const offer: StoredOffer = {
  id: 'off-1',
  createdAt: 1,
  updatedAt: 2,
  captureKind: 'dictation',
  title: 'Testangebot',
  servicePeriodStart: '2026-01-01',
  servicePeriodEnd: '2026-01-31',
  synced: false,
  lines: [
    {
      id: 'l1',
      quantity: 1,
      unit: 'Stück',
      unitCode: 'H87',
      description: 'Kabel',
      unitPriceNet: 10,
      taxRate: 19,
      confirmed: true,
    },
  ],
}

const profile: CompanyProfile = {
  name: 'Test GmbH',
  street: 'Weg 1',
  postCode: '10115',
  city: 'Berlin',
  countryCode: 'DE',
  email: 'a@example.com',
  taxNumber: '12/345/67890',
  vatId: '',
  iban: 'DE89370400440532013000',
  bic: 'COBADEFFXXX',
  logoDataUrl: '',
  kleinunternehmer: false,
  contactName: 'Test',
  contactPhone: '+49 30 000',
}

const invoice: StoredInvoice = {
  id: 'inv-1',
  offerId: 'off-1',
  createdAt: 3,
  updatedAt: 4,
  invoiceNumber: 'RE-2026-0001',
  issueDate: '2026-02-01',
  dueDate: '2026-02-15',
  buyerReference: 'PO-1',
  iban: profile.iban,
  bic: profile.bic,
  seller: {
    name: profile.name,
    street: profile.street,
    postCode: profile.postCode,
    city: profile.city,
    countryCode: 'DE',
    email: profile.email,
    vatId: '',
    taxNumber: profile.taxNumber,
    contactName: profile.contactName,
    contactPhone: profile.contactPhone,
  },
  buyer: {
    name: 'Kunde AG',
    street: 'Allee 2',
    postCode: '80331',
    city: 'München',
    countryCode: 'DE',
    email: 'k@example.com',
    vatId: 'DE999',
    taxNumber: '',
    contactName: 'Einkauf',
    contactPhone: '+49 89 000',
  },
  lines: offer.lines,
  servicePeriodStart: offer.servicePeriodStart,
  servicePeriodEnd: offer.servicePeriodEnd,
  status: 'exported',
  buyerIsPrivatePerson: false,
  bauGrundstueckLeistung: false,
  kleinunternehmer: false,
  totals: { net: 10, tax: 1.9, gross: 11.9 },
  taxBreakdown: [{ rate: 19, net: 10, tax: 1.9 }],
  retentionNote: null,
}

describe('backup export/import', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('orbit-offers')
    await setBusinessConsentAccepted()
    await saveCompanyProfile(profile)
    await saveOffer(offer)
    await saveInvoice(invoice)
    await setInvoiceCounterForTests({ lastSeq: 5, prefix: 'RE' })
  })

  it('Export→Import yields identical payload (ignoring exportedAt)', async () => {
    expect(await roundTripBackupIdentical()).toBe(true)
  })

  it('import never resets invoice counter downward', async () => {
    const payload = await buildBackupPayload()
    payload.invoiceCounter = { lastSeq: 2, prefix: 'RE' }
    const file = new File([normalizeBackupForCompare(payload)], 'backup.json', {
      type: 'application/json',
    })
    // Build a proper JSON file from payload
    const jsonFile = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' })
    await setInvoiceCounterForTests({ lastSeq: 9, prefix: 'RE' })
    await importBackupZip(jsonFile)
    const counter = await getInvoiceCounter()
    expect(counter.lastSeq).toBe(9)
    void file
  })

  it('mergeInvoiceCounter keeps max seq', async () => {
    await setInvoiceCounterForTests({ lastSeq: 3, prefix: 'RE' })
    await mergeInvoiceCounter({ lastSeq: 10, prefix: 'RE' })
    expect((await getInvoiceCounter()).lastSeq).toBe(10)
    await mergeInvoiceCounter({ lastSeq: 4, prefix: 'RE' })
    expect((await getInvoiceCounter()).lastSeq).toBe(10)
  })
})
