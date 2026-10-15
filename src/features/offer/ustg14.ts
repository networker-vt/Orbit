import type {
  InvoiceDraft,
  OfferLineItem,
  StoredOffer,
  TaxBreakdownRow,
} from './types'
import { RETENTION_NOTE_PRIVATE_BAU } from './types'
import { validateCompanyProfile, type ProfileValidationIssue } from './companyProfile'
import { validateLeitweg, type LeitwegIssue } from './customers'
import type { CompanyProfile } from './types'

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
  | 'line.quantity'
  | 'line.description'
  | 'line.taxRate'
  | 'tax.breakdown'
  | 'tax.amount'
  | 'payment.iban'
  | 'retention.note'
  | 'customer.leitwegId'

export type UstgValidationIssue = {
  field: UstgFieldKey | ProfileValidationIssue['field'] | LeitwegIssue['field']
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
  'servicePeriod': 'Leistungsdatum / Leistungszeitraum',
  'lines': 'Menge und Art der Leistung (Positionen)',
  'line.quantity': 'Menge je Position',
  'line.description': 'Art der Leistung (Beschreibung)',
  'line.taxRate': 'Steuersatz (Umsatzsteuer) je Position',
  'tax.breakdown': 'Entgelt je Steuersatz',
  'tax.amount': 'Steuerbetrag',
  'payment.iban': 'Zahlungsinformationen (IBAN)',
  'retention.note': 'Aufbewahrungshinweis (§ 14 Abs. 4 Nr. 9 UStG)',
  'customer.leitwegId': 'Leitweg-ID (öffentlicher Auftraggeber / XRechnung BT-10)',
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

export function taxBreakdown(lines: OfferLineItem[]): TaxBreakdownRow[] {
  const map = new Map<number, TaxBreakdownRow>()
  for (const line of lines.filter((l) => l.confirmed && l.taxRate !== null)) {
    const rate = line.taxRate as number
    const net = line.quantity * line.unitPriceNet
    const prev = map.get(rate) ?? { rate, net: 0, tax: 0 }
    prev.net += net
    prev.tax += net * (rate / 100)
    map.set(rate, prev)
  }
  return [...map.values()].sort((a, b) => a.rate - b.rate)
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

export function needsRetentionNote(invoice: InvoiceDraft): boolean {
  return invoice.buyerIsPrivatePerson && invoice.bauGrundstueckLeistung
}

export function retentionNoteFor(invoice: InvoiceDraft): string | null {
  return needsRetentionNote(invoice) ? RETENTION_NOTE_PRIVATE_BAU : null
}

/**
 * § 14 Abs. 4 UStG completeness check.
 * Steuernr. OR USt-IdNr. is sufficient. Steuersatz is never auto-filled.
 * Optional company profile: missing §14 seller fields block export naming the field.
 */
export function validateUstg14(
  offer: StoredOffer,
  invoice: InvoiceDraft,
  lines: OfferLineItem[],
  profile?: CompanyProfile | null,
): UstgValidationIssue[] {
  const issues: UstgValidationIssue[] = []

  if (profile !== undefined) {
    issues.push(...validateCompanyProfile(profile))
  }

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
    if (!(line.quantity > 0)) {
      issues.push({
        field: 'line.quantity',
        labelDe: `${FIELD_LABELS['line.quantity']} (${line.description || 'Position'})`,
      })
    }
    if (!line.description.trim()) {
      issues.push({ field: 'line.description', labelDe: FIELD_LABELS['line.description'] })
    }
    if (line.taxRate === null) {
      issues.push({
        field: 'line.taxRate',
        labelDe: `${FIELD_LABELS['line.taxRate']} (${line.description || 'Position'})`,
      })
    }
  }

  const breakdown = taxBreakdown(confirmed)
  if (confirmed.length > 0 && confirmed.every((l) => l.taxRate !== null) && breakdown.length === 0) {
    issues.push({ field: 'tax.breakdown', labelDe: FIELD_LABELS['tax.breakdown'] })
  }
  // Steuerbetrag must be computable (including 0 for Kleinunternehmer / 0 %)
  if (confirmed.length > 0 && confirmed.every((l) => l.taxRate !== null)) {
    const totals = lineTotals(confirmed)
    if (!Number.isFinite(totals.tax)) {
      issues.push({ field: 'tax.amount', labelDe: FIELD_LABELS['tax.amount'] })
    }
  }

  if (!invoice.iban.trim()) {
    issues.push({ field: 'payment.iban', labelDe: FIELD_LABELS['payment.iban'] })
  }

  // Retention sentence is mandatory when flags set — enforced by always attaching it;
  // surface as issue only if flags contradict missing note generation (should not happen).
  if (needsRetentionNote(invoice) && !retentionNoteFor(invoice)) {
    issues.push({ field: 'retention.note', labelDe: FIELD_LABELS['retention.note'] })
  }

  issues.push(
    ...validateLeitweg({
      publicBuyer: invoice.publicBuyer,
      leitwegId: invoice.leitwegId || invoice.buyerReference,
    }),
  )

  return issues
}
