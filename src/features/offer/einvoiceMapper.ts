import type { InvoiceDraft, OfferLineItem, StoredOffer } from './types'
import { KLEINUNTERNEHMER_HINT, RETENTION_NOTE_PRIVATE_BAU } from './types'
import { lineTotals, needsRetentionNote, taxBreakdown } from './ustg14'

/** UBL invoice object for @e-invoice-eu/core (XRechnung / Factur-X). */
export type EInvoiceUblPayload = {
  'ubl:Invoice': Record<string, unknown>
}

function money(n: number): string {
  return n.toFixed(2)
}

function vatCategory(rate: number, kleinunternehmer: boolean): string {
  if (kleinunternehmer || rate === 0) return 'Z'
  return 'S'
}

function sellerTaxScheme(invoice: InvoiceDraft) {
  const id = invoice.seller.vatId.trim() || invoice.seller.taxNumber.trim()
  if (!id) return undefined
  return [{ 'cbc:CompanyID': id, 'cac:TaxScheme': { 'cbc:ID': 'VAT' } }]
}

function documentNotes(offer: StoredOffer, invoice: InvoiceDraft): string[] {
  const notes = [`Angebot: ${offer.title}`]
  if (invoice.kleinunternehmer) notes.push(KLEINUNTERNEHMER_HINT)
  if (needsRetentionNote(invoice)) notes.push(RETENTION_NOTE_PRIVATE_BAU)
  return notes
}

export function buildEInvoiceUbl(
  offer: StoredOffer,
  invoice: InvoiceDraft,
  lines: OfferLineItem[],
): EInvoiceUblPayload {
  const active = lines.filter((l) => l.confirmed)
  const { net, tax, gross } = lineTotals(active)
  const breakdown = taxBreakdown(active)

  const taxSubtotals = breakdown.map((bucket) => ({
    'cbc:TaxableAmount': money(bucket.net),
    'cbc:TaxableAmount@currencyID': 'EUR',
    'cbc:TaxAmount': money(bucket.tax),
    'cbc:TaxAmount@currencyID': 'EUR',
    'cac:TaxCategory': {
      'cbc:ID': vatCategory(bucket.rate, invoice.kleinunternehmer),
      'cbc:Percent': String(bucket.rate),
      ...(invoice.kleinunternehmer
        ? { 'cbc:TaxExemptionReason': KLEINUNTERNEHMER_HINT }
        : {}),
      'cac:TaxScheme': { 'cbc:ID': 'VAT' },
    },
  }))

  const invoiceLines = active.map((line, index) => {
    const lineNet = line.quantity * line.unitPriceNet
    const rate = line.taxRate ?? 0
    return {
      'cbc:ID': String(index + 1),
      'cbc:InvoicedQuantity': String(line.quantity),
      'cbc:InvoicedQuantity@unitCode': line.unitCode,
      'cbc:LineExtensionAmount': money(lineNet),
      'cbc:LineExtensionAmount@currencyID': 'EUR',
      'cac:Item': {
        'cbc:Name': line.description,
        'cac:ClassifiedTaxCategory': {
          'cbc:ID': vatCategory(rate, invoice.kleinunternehmer),
          'cbc:Percent': String(rate),
          'cac:TaxScheme': { 'cbc:ID': 'VAT' },
        },
      },
      'cac:Price': {
        'cbc:PriceAmount': money(line.unitPriceNet),
        'cbc:PriceAmount@currencyID': 'EUR',
      },
    }
  })

  const paymentAccount: Record<string, unknown> = {
    'cbc:ID': invoice.iban.replace(/\s/g, ''),
  }
  if (invoice.bic.trim()) {
    paymentAccount['cac:FinancialInstitutionBranch'] = {
      'cbc:ID': invoice.bic.replace(/\s/g, ''),
    }
  }

  return {
    'ubl:Invoice': {
      'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0',
      'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
      'cbc:ID': invoice.invoiceNumber.trim(),
      'cbc:IssueDate': invoice.issueDate.trim(),
      'cbc:DueDate': invoice.dueDate.trim(),
      'cbc:InvoiceTypeCode': '380',
      'cbc:DocumentCurrencyCode': 'EUR',
      // XRechnung BT-10: Leitweg-ID for public buyers, else buyer reference
      'cbc:BuyerReference':
        (invoice.publicBuyer ? invoice.leitwegId.trim() : invoice.buyerReference.trim()) ||
        invoice.leitwegId.trim() ||
        'Kunde-Referenz',
      'cbc:Note': documentNotes(offer, invoice),
      'cac:InvoicePeriod': {
        'cbc:StartDate': offer.servicePeriodStart,
        'cbc:EndDate': offer.servicePeriodEnd,
      },
      'cac:AccountingSupplierParty': {
        'cac:Party': {
          'cbc:EndpointID': invoice.seller.email.trim() || 'seller@example.invalid',
          'cbc:EndpointID@schemeID': 'EM',
          'cac:PartyName': { 'cbc:Name': invoice.seller.name.trim() },
          'cac:PostalAddress': {
            'cbc:StreetName': invoice.seller.street.trim(),
            'cbc:CityName': invoice.seller.city.trim(),
            'cbc:PostalZone': invoice.seller.postCode.trim(),
            'cac:Country': { 'cbc:IdentificationCode': invoice.seller.countryCode },
          },
          'cac:PartyTaxScheme': sellerTaxScheme(invoice),
          'cac:PartyLegalEntity': { 'cbc:RegistrationName': invoice.seller.name.trim() },
          'cac:Contact': {
            'cbc:Name': invoice.seller.contactName.trim() || invoice.seller.name.trim(),
            'cbc:Telephone': invoice.seller.contactPhone.trim() || '+49 000 0000000',
            'cbc:ElectronicMail': invoice.seller.email.trim() || 'seller@example.invalid',
          },
        },
      },
      'cac:AccountingCustomerParty': {
        'cac:Party': {
          'cbc:EndpointID': invoice.buyer.email.trim() || 'buyer@example.invalid',
          'cbc:EndpointID@schemeID': 'EM',
          'cac:PartyName': { 'cbc:Name': invoice.buyer.name.trim() },
          'cac:PostalAddress': {
            'cbc:StreetName': invoice.buyer.street.trim(),
            'cbc:CityName': invoice.buyer.city.trim(),
            'cbc:PostalZone': invoice.buyer.postCode.trim(),
            'cac:Country': { 'cbc:IdentificationCode': invoice.buyer.countryCode },
          },
          'cac:PartyLegalEntity': { 'cbc:RegistrationName': invoice.buyer.name.trim() },
        },
      },
      'cac:PaymentMeans': [
        {
          'cbc:PaymentMeansCode': '58',
          'cac:PayeeFinancialAccount': paymentAccount,
        },
      ],
      'cac:TaxTotal': [
        {
          'cbc:TaxAmount': money(tax),
          'cbc:TaxAmount@currencyID': 'EUR',
          'cac:TaxSubtotal': taxSubtotals,
        },
      ],
      'cac:LegalMonetaryTotal': {
        'cbc:LineExtensionAmount': money(net),
        'cbc:LineExtensionAmount@currencyID': 'EUR',
        'cbc:TaxExclusiveAmount': money(net),
        'cbc:TaxExclusiveAmount@currencyID': 'EUR',
        'cbc:TaxInclusiveAmount': money(gross),
        'cbc:TaxInclusiveAmount@currencyID': 'EUR',
        'cbc:PayableAmount': money(gross),
        'cbc:PayableAmount@currencyID': 'EUR',
      },
      'cac:InvoiceLine': invoiceLines,
    },
  }
}
