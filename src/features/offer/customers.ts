import type { InvoiceDraft, InvoiceParty, StoredCustomer } from './types'
import {
  LEITWEG_HINT_BUND,
  LEITWEG_HINT_LAND,
  LEITWEG_URL_OZG_RE,
  LEITWEG_URL_ZRE,
} from './types'

export type LeitwegIssue = {
  field: 'customer.leitwegId'
  labelDe: string
}

/** Leitweg-ID Pflicht für öffentlichen Auftraggeber (XRechnung BT-10). */
export function validateLeitweg(customer: Pick<StoredCustomer, 'publicBuyer' | 'leitwegId'>): LeitwegIssue[] {
  if (!customer.publicBuyer) return []
  if (!customer.leitwegId.trim()) {
    return [
      {
        field: 'customer.leitwegId',
        labelDe: 'Leitweg-ID (öffentlicher Auftraggeber / XRechnung BT-10)',
      },
    ]
  }
  return []
}

export function customerToBuyer(customer: StoredCustomer): InvoiceParty {
  return {
    name: customer.name,
    street: customer.street,
    postCode: customer.postCode,
    city: customer.city,
    countryCode: 'DE',
    email: customer.email,
    vatId: customer.vatId,
    taxNumber: customer.taxNumber,
    contactName: customer.contactName || customer.name,
    contactPhone: customer.contactPhone,
  }
}

export function applyCustomerToInvoice(draft: InvoiceDraft, customer: StoredCustomer): InvoiceDraft {
  return {
    ...draft,
    customerId: customer.id,
    publicBuyer: customer.publicBuyer,
    leitwegId: customer.leitwegId,
    buyerReference: customer.publicBuyer ? customer.leitwegId.trim() : draft.buyerReference,
    buyer: customerToBuyer(customer),
    buyerIsPrivatePerson: customer.publicBuyer ? false : draft.buyerIsPrivatePerson,
  }
}

export function emptyCustomer(): Omit<StoredCustomer, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    street: '',
    postCode: '',
    city: '',
    email: '',
    vatId: '',
    taxNumber: '',
    contactName: '',
    contactPhone: '',
    publicBuyer: false,
    leitwegId: '',
  }
}

export function leitwegPortalHints(): {
  bund: string
  land: string
  zreUrl: string
  ozgReUrl: string
} {
  return {
    bund: LEITWEG_HINT_BUND,
    land: LEITWEG_HINT_LAND,
    zreUrl: LEITWEG_URL_ZRE,
    ozgReUrl: LEITWEG_URL_OZG_RE,
  }
}
