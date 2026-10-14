import type { InvoiceDraft } from './types'

export const DEMO_SELLER: InvoiceDraft['seller'] = {
  name: 'Demo Veranstaltungstechnik GmbH',
  street: 'Industrieweg 12',
  postCode: '50667',
  city: 'Köln',
  countryCode: 'DE',
  email: 'rechnung@demo-veranstaltung.example',
  vatId: 'DE123456789',
  taxNumber: '',
  contactName: 'Service Team',
  contactPhone: '+49 221 0000000',
}

export const DEMO_BUYER: InvoiceDraft['buyer'] = {
  name: 'Demo Messe Betrieb AG',
  street: 'Hallenallee 3',
  postCode: '40210',
  city: 'Düsseldorf',
  countryCode: 'DE',
  email: 'einkauf@demo-messe.example',
  vatId: '',
  taxNumber: '123/4567/8901',
  contactName: 'Einkauf',
  contactPhone: '+49 211 0000000',
}

/** Demo draft for tests — production UI uses Firmenprofil + allocateInvoiceNumber. */
export function defaultInvoiceDraft(): InvoiceDraft {
  const today = new Date()
  const issue = today.toISOString().slice(0, 10)
  const due = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10)
  return {
    invoiceNumber: `RE-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-001`,
    issueDate: issue,
    dueDate: due,
    buyerReference: 'PO-DEMO-2026',
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX',
    seller: { ...DEMO_SELLER },
    buyer: { ...DEMO_BUYER },
    buyerIsPrivatePerson: false,
    bauGrundstueckLeistung: false,
    kleinunternehmer: false,
  }
}
