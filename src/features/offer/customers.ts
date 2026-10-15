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

/** Exact field message when check digit fails (ISO 7064 Mod 97-10). */
export const LEITWEG_CHECK_DIGIT_MSG =
  'Prüfziffer stimmt nicht – bitte Leitweg-ID beim Auftraggeber prüfen'

const LEITWEG_REQUIRED_MSG = 'Leitweg-ID (öffentlicher Auftraggeber / XRechnung BT-10)'

/** Max length per Leitweg-ID rules (incl. hyphens). */
export const LEITWEG_MAX_LENGTH = 46

/**
 * Structure: Grob[-Fein]-Prüfziffer (hyphen-separated numeric segments,
 * last segment = 2-digit check). Max 46 chars.
 */
const LEITWEG_STRUCTURE = /^(\d{1,11})(?:-(\d{1,30}))?-(\d{2})$/

/** ISO 7064 Mod 97-10 check digits for the numeric body (without hyphens / check). */
export function leitwegCheckDigits(bodyDigits: string): string {
  const n = BigInt(`${bodyDigits}00`)
  const rem = Number(n % 97n)
  return String(98 - rem).padStart(2, '0')
}

export function isValidLeitwegId(raw: string): boolean {
  const id = raw.trim()
  if (!id || id.length > LEITWEG_MAX_LENGTH) return false
  const m = LEITWEG_STRUCTURE.exec(id)
  if (!m) return false
  const digits = id.replace(/-/g, '')
  if (!/^\d+$/.test(digits) || digits.length < 3) return false
  const body = digits.slice(0, -2)
  const given = digits.slice(-2)
  return leitwegCheckDigits(body) === given
}

/** Leitweg-ID Pflicht + Struktur/Prüfziffer für öffentlichen Auftraggeber (XRechnung BT-10). */
export function validateLeitweg(
  customer: Pick<StoredCustomer, 'publicBuyer' | 'leitwegId'>,
): LeitwegIssue[] {
  if (!customer.publicBuyer) return []
  const id = customer.leitwegId.trim()
  if (!id) {
    return [{ field: 'customer.leitwegId', labelDe: LEITWEG_REQUIRED_MSG }]
  }
  if (!isValidLeitwegId(id)) {
    return [{ field: 'customer.leitwegId', labelDe: LEITWEG_CHECK_DIGIT_MSG }]
  }
  return []
}

/**
 * Unchecking „öffentlicher Auftraggeber“ clears Leitweg-ID and BuyerReference (BT-10).
 */
export function clearPublicBuyerFields<T extends { publicBuyer: boolean; leitwegId: string; buyerReference: string }>(
  draft: T,
): T {
  return {
    ...draft,
    publicBuyer: false,
    leitwegId: '',
    buyerReference: '',
  }
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
  if (!customer.publicBuyer) {
    return {
      ...draft,
      customerId: customer.id,
      publicBuyer: false,
      leitwegId: '',
      buyerReference: '',
      buyer: customerToBuyer(customer),
      buyerIsPrivatePerson: draft.buyerIsPrivatePerson,
    }
  }
  return {
    ...draft,
    customerId: customer.id,
    publicBuyer: true,
    leitwegId: customer.leitwegId,
    buyerReference: customer.leitwegId.trim(),
    buyer: customerToBuyer(customer),
    buyerIsPrivatePerson: false,
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
