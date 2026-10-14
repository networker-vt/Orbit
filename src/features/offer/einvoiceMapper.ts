import type { InvoiceDraft, OfferLineItem, StoredOffer } from './types'
import { lineTotals } from './ustg14'

/** UBL invoice object for @e-invoice-eu/core (XRechnung / Factur-X). */
export type EInvoiceUblPayload = {
  'ubl:Invoice': Record<string, unknown>
}

function money(n: number): string {
  return n.toFixed(2)
}

function vatCategory(rate: number): string {
  if (rate === 0) return 'Z'
  return 'S'
}

function sellerTaxScheme(invoice: InvoiceDraft) {
  const id = invoice.seller.vatId.trim() || invoice.seller.taxNumber.trim()
  if (!id) return undefined
  return [{ 'cbc:CompanyID': id, 'cac:TaxScheme': { 'cbc:ID': 'VAT' } }]
}

export function buildEInvoiceUbl(
  offer: StoredOffer,
  invoice: InvoiceDraft,
  lines: OfferLineItem[],
): EInvoiceUblPayload {
  const active = lines.filter((l) => l.confirmed)
  const { net, tax, gross } = lineTotals(active)

  const taxByRate = new Map<number, { taxable: number; tax: number }>()
  for (const line of active) {
    const rate = line.taxRate ?? 0
    const lineNet = line.quantity * line.unitPriceNet
    const prev = taxByRate.get(rate) ?? { taxable: 0, tax: 0 }
    prev.taxable += lineNet
    prev.tax += lineNet * (rate / 100)
    taxByRate.set(rate, prev)
  }

  const taxSubtotals = [...taxByRate.entries()].map(([rate, bucket]) => ({
    'cbc:TaxableAmount': money(bucket.taxable),
    'cbc:TaxableAmount@currencyID': 'EUR',
    'cbc:TaxAmount': money(bucket.tax),
    'cbc:TaxAmount@currencyID': 'EUR',
    'cac:TaxCategory': {
      'cbc:ID': vatCategory(rate),
      'cbc:Percent': String(rate),
      'cac:TaxScheme': { 'cbc:ID': 'VAT' },
    },
  }))

  const invoiceLines = active.map((line, index) => {
    const lineNet = line.quantity * line.unitPriceNet
    return {
      'cbc:ID': String(index + 1),
      'cbc:InvoicedQuantity': String(line.quantity),
      'cbc:InvoicedQuantity@unitCode': line.unitCode,
      'cbc:LineExtensionAmount': money(lineNet),
      'cbc:LineExtensionAmount@currencyID': 'EUR',
      'cac:Item': {
        'cbc:Name': line.description,
        'cac:ClassifiedTaxCategory': {
          'cbc:ID': vatCategory(line.taxRate ?? 0),
          'cbc:Percent': String(line.taxRate ?? 0),
          'cac:TaxScheme': { 'cbc:ID': 'VAT' },
        },
      },
      'cac:Price': {
        'cbc:PriceAmount': money(line.unitPriceNet),
        'cbc:PriceAmount@currencyID': 'EUR',
      },
    }
  })

  return {
    'ubl:Invoice': {
      'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0',
      'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
      'cbc:ID': invoice.invoiceNumber.trim(),
      'cbc:IssueDate': invoice.issueDate.trim(),
      'cbc:DueDate': invoice.dueDate.trim(),
      'cbc:InvoiceTypeCode': '380',
      'cbc:DocumentCurrencyCode': 'EUR',
      'cbc:BuyerReference': invoice.buyerReference.trim() || 'Kunde-Referenz',
      'cbc:Note': [`Angebot: ${offer.title}`],
      'cac:InvoicePeriod': {
        'cbc:StartDate': offer.servicePeriodStart,
        'cbc:EndDate': offer.servicePeriodEnd,
      },
      'cac:AccountingSupplierParty': {
        'cac:Party': {
          'cbc:EndpointID': invoice.seller.email.trim(),
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
            'cbc:ElectronicMail': invoice.seller.email.trim(),
          },
        },
      },
      'cac:AccountingCustomerParty': {
        'cac:Party': {
          'cbc:EndpointID': invoice.buyer.email.trim(),
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
          'cac:PayeeFinancialAccount': { 'cbc:ID': invoice.iban.replace(/\s/g, '') },
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
