import type { InvoiceDraft, OfferLineItem, StoredOffer } from './types'

export type UstgFieldKey =
  | 'seller.name'
  | 'seller.street'
  | 'seller.postCode'
  | 'seller.city'
  | 'seller.taxOrVat'
  | 'buyer.name'
  | 'buyer.street'
  | 'buyer.postCode'
  | 'buyer.city'
  | 'invoiceNumber'
  | 'issueDate'
  | 'servicePeriod'
  | 'lines'
  | 'line.taxRate'
  | 'payment.iban'

export type UstgValidationIssue = {
  field: UstgFieldKey
  labelDe: string
}

const FIELD_LABELS: Record<UstgFieldKey, string> = {
  'seller.name': 'Name und Anschrift des leistenden Unternehmers (Name)',
  'seller.street': 'Name und Anschrift des leistenden Unternehmers (Straße)',
  'seller.postCode': 'Name und Anschrift des leistenden Unternehmers (PLZ)',
  'seller.city': 'Name und Anschrift des leistenden Unternehmers (Ort)',
  'seller.taxOrVat': 'Steuernummer oder USt-IdNr. des Unternehmers',
  'buyer.name': 'Name und Anschrift des Leistungsempfängers (Name)',
  'buyer.street': 'Name und Anschrift des Leistungsempfängers (Straße)',
  'buyer.postCode': 'Name und Anschrift des Leistungsempfängers (PLZ)',
  'buyer.city': 'Name und Anschrift des Leistungsempfängers (Ort)',
  'invoiceNumber': 'Fortlaufende Rechnungsnummer',
  'issueDate': 'Ausstellungsdatum',
  'servicePeriod': 'Leistungszeitraum',
  'lines': 'Leistungsbeschreibung (Positionen)',
  'line.taxRate': 'Steuersatz (Umsatzsteuer) je Position',
  'payment.iban': 'Zahlungsinformationen (IBAN)',
}

export function ustgFieldLabel(field: UstgFieldKey): string {
  return FIELD_LABELS[field]
}

function hasTaxId(party: InvoiceDraft['seller']): boolean {
  return party.vatId.trim().length > 0 || party.taxNumber.trim().length > 0
}

function partyFilled(party: InvoiceDraft['seller'], prefix: 'seller' | 'buyer'): UstgValidationIssue[] {
  const issues: UstgValidationIssue[] = []
  if (!party.name.trim()) issues.push({ field: `${prefix}.name`, labelDe: FIELD_LABELS[`${prefix}.name`] })
  if (!party.street.trim()) issues.push({ field: `${prefix}.street`, labelDe: FIELD_LABELS[`${prefix}.street`] })
  if (!party.postCode.trim()) issues.push({ field: `${prefix}.postCode`, labelDe: FIELD_LABELS[`${prefix}.postCode`] })
  if (!party.city.trim()) issues.push({ field: `${prefix}.city`, labelDe: FIELD_LABELS[`${prefix}.city`] })
  return issues
}

export function validateUstg14(offer: StoredOffer, invoice: InvoiceDraft, lines: OfferLineItem[]): UstgValidationIssue[] {
  const issues: UstgValidationIssue[] = []
  issues.push(...partyFilled(invoice.seller, 'seller'))
  if (!hasTaxId(invoice.seller)) {
    issues.push({ field: 'seller.taxOrVat', labelDe: FIELD_LABELS['seller.taxOrVat'] })
  }
  issues.push(...partyFilled(invoice.buyer, 'buyer'))
  if (!invoice.invoiceNumber.trim()) {
    issues.push({ field: 'invoiceNumber', labelDe: FIELD_LABELS.invoiceNumber })
  }
  if (!invoice.issueDate.trim()) {
    issues.push({ field: 'issueDate', labelDe: FIELD_LABELS.issueDate })
  }
  if (!offer.servicePeriodStart.trim() || !offer.servicePeriodEnd.trim()) {
    issues.push({ field: 'servicePeriod', labelDe: FIELD_LABELS.servicePeriod })
  }
  const confirmed = lines.filter((l) => l.confirmed)
  if (confirmed.length === 0) {
    issues.push({ field: 'lines', labelDe: FIELD_LABELS.lines })
  }
  for (const line of confirmed) {
    if (line.taxRate === null) {
      issues.push({ field: 'line.taxRate', labelDe: `${FIELD_LABELS['line.taxRate']} (${line.description || 'Position'})` })
    }
  }
  if (!invoice.iban.trim()) {
    issues.push({ field: 'payment.iban', labelDe: FIELD_LABELS['payment.iban'] })
  }
  return issues
}

export function lineTotals(lines: OfferLineItem[]) {
  let net = 0
  let tax = 0
  for (const line of lines.filter((l) => l.confirmed)) {
    const lineNet = line.quantity * line.unitPriceNet
    net += lineNet
    tax += lineNet * ((line.taxRate ?? 0) / 100)
  }
  return { net, tax, gross: net + tax }
}
