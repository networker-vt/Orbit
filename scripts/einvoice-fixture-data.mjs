/** Demo invoice payloads (anonymized parties) for fixtures and CI. */

function line(id, qty, unitCode, name, price, rate) {
  const lineNet = qty * price
  return {
    'cbc:ID': String(id),
    'cbc:InvoicedQuantity': String(qty),
    'cbc:InvoicedQuantity@unitCode': unitCode,
    'cbc:LineExtensionAmount': lineNet.toFixed(2),
    'cbc:LineExtensionAmount@currencyID': 'EUR',
    'cac:Item': {
      'cbc:Name': name,
      'cac:ClassifiedTaxCategory': {
        'cbc:ID': rate === 0 ? 'Z' : 'S',
        'cbc:Percent': String(rate),
        'cac:TaxScheme': { 'cbc:ID': 'VAT' },
      },
    },
    'cac:Price': { 'cbc:PriceAmount': price.toFixed(2), 'cbc:PriceAmount@currencyID': 'EUR' },
  }
}

function shell({ id, issue, due, buyerRef, period, seller, buyer, iban, lines, net, tax, gross }) {
  return {
    'ubl:Invoice': {
      'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0',
      'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
      'cbc:ID': id,
      'cbc:IssueDate': issue,
      'cbc:DueDate': due,
      'cbc:InvoiceTypeCode': '380',
      'cbc:DocumentCurrencyCode': 'EUR',
      'cbc:BuyerReference': buyerRef,
      'cac:InvoicePeriod': period,
      'cac:AccountingSupplierParty': {
        'cac:Party': {
          'cbc:EndpointID': seller.email,
          'cbc:EndpointID@schemeID': 'EM',
          'cac:PartyName': { 'cbc:Name': seller.name },
          'cac:PostalAddress': {
            'cbc:StreetName': seller.street,
            'cbc:CityName': seller.city,
            'cbc:PostalZone': seller.zip,
            'cac:Country': { 'cbc:IdentificationCode': 'DE' },
          },
          'cac:PartyTaxScheme': [{ 'cbc:CompanyID': seller.vat, 'cac:TaxScheme': { 'cbc:ID': 'VAT' } }],
          'cac:PartyLegalEntity': { 'cbc:RegistrationName': seller.name },
          'cac:Contact': {
            'cbc:Name': seller.contact,
            'cbc:Telephone': seller.phone,
            'cbc:ElectronicMail': seller.email,
          },
        },
      },
      'cac:AccountingCustomerParty': {
        'cac:Party': {
          'cbc:EndpointID': buyer.email,
          'cbc:EndpointID@schemeID': 'EM',
          'cac:PartyName': { 'cbc:Name': buyer.name },
          'cac:PostalAddress': {
            'cbc:StreetName': buyer.street,
            'cbc:CityName': buyer.city,
            'cbc:PostalZone': buyer.zip,
            'cac:Country': { 'cbc:IdentificationCode': 'DE' },
          },
          'cac:PartyLegalEntity': { 'cbc:RegistrationName': buyer.name },
        },
      },
      'cac:PaymentMeans': [{ 'cbc:PaymentMeansCode': '58', 'cac:PayeeFinancialAccount': { 'cbc:ID': iban } }],
      'cac:TaxTotal': [
        {
          'cbc:TaxAmount': tax.toFixed(2),
          'cbc:TaxAmount@currencyID': 'EUR',
          'cac:TaxSubtotal': [
            {
              'cbc:TaxableAmount': net.toFixed(2),
              'cbc:TaxableAmount@currencyID': 'EUR',
              'cbc:TaxAmount': tax.toFixed(2),
              'cbc:TaxAmount@currencyID': 'EUR',
              'cac:TaxCategory': {
                'cbc:ID': tax === 0 ? 'Z' : 'S',
                'cbc:Percent': tax === 0 ? '0' : '19',
                'cac:TaxScheme': { 'cbc:ID': 'VAT' },
              },
            },
          ],
        },
      ],
      'cac:LegalMonetaryTotal': {
        'cbc:LineExtensionAmount': net.toFixed(2),
        'cbc:LineExtensionAmount@currencyID': 'EUR',
        'cbc:TaxExclusiveAmount': net.toFixed(2),
        'cbc:TaxExclusiveAmount@currencyID': 'EUR',
        'cbc:TaxInclusiveAmount': gross.toFixed(2),
        'cbc:TaxInclusiveAmount@currencyID': 'EUR',
        'cbc:PayableAmount': gross.toFixed(2),
        'cbc:PayableAmount@currencyID': 'EUR',
      },
      'cac:InvoiceLine': lines,
    },
  }
}

export function buildFixtureInvoices() {
  const seller = {
    name: 'Demo Veranstaltungstechnik GmbH',
    street: 'Industrieweg 12',
    city: 'Köln',
    zip: '50667',
    email: 'rechnung@demo-veranstaltung.example',
    vat: 'DE123456789',
    contact: 'Service Team',
    phone: '+49 221 0000000',
  }
  return [
    {
      name: 'fixture-1-event-tech',
      invoice: shell({
        id: 'RE-DEMO-2026-001',
        issue: '2026-03-01',
        due: '2026-03-15',
        buyerRef: 'PO-EVT-1001',
        period: { 'cbc:StartDate': '2026-02-10', 'cbc:EndDate': '2026-02-12' },
        seller,
        buyer: {
          name: 'Demo Messe Betrieb AG',
          street: 'Hallenallee 3',
          city: 'Düsseldorf',
          zip: '40210',
          email: 'einkauf@demo-messe.example',
        },
        iban: 'DE89370400440532013000',
        lines: [line(1, 12, 'H87', 'LED-PAR Scheinwerfer', 18.5, 19), line(2, 6, 'HUR', 'Montage Traversen', 65, 19)],
        net: 612,
        tax: 116.28,
        gross: 728.28,
      }),
    },
    {
      name: 'fixture-2-lighting',
      invoice: shell({
        id: 'RE-DEMO-2026-002',
        issue: '2026-03-05',
        due: '2026-03-20',
        buyerRef: 'PO-LGT-2044',
        period: { 'cbc:StartDate': '2026-02-20', 'cbc:EndDate': '2026-02-21' },
        seller,
        buyer: {
          name: 'Demo Konzerthaus e.V.',
          street: 'Musikplatz 1',
          city: 'Leipzig',
          zip: '04109',
          email: 'technik@demo-konzert.example',
        },
        iban: 'DE89370400440532013000',
        lines: [line(1, 8, 'H87', 'Moving Head', 120, 19), line(2, 4, 'HUR', 'Lichtoperator', 72, 19)],
        net: 1248,
        tax: 237.12,
        gross: 1485.12,
      }),
    },
    {
      name: 'fixture-3-stage',
      invoice: shell({
        id: 'RE-DEMO-2026-003',
        issue: '2026-03-08',
        due: '2026-03-22',
        buyerRef: 'PO-STG-3300',
        period: { 'cbc:StartDate': '2026-03-01', 'cbc:EndDate': '2026-03-02' },
        seller,
        buyer: {
          name: 'Demo Festival Crew UG',
          street: 'Wiesengrund 7',
          city: 'Hannover',
          zip: '30159',
          email: 'booking@demo-festival.example',
        },
        iban: 'DE89370400440532013000',
        lines: [line(1, 1, 'C62', 'Bühnenpodest-Paket', 890, 19), line(2, 10, 'HUR', 'Stage Hands', 45, 19)],
        net: 1340,
        tax: 254.6,
        gross: 1594.6,
      }),
    },
    {
      // öffentlicher Auftraggeber mit Leitweg-ID (XRechnung BT-10)
      name: 'fixture-4-public-leitweg',
      invoice: shell({
        id: 'RE-DEMO-2026-004',
        issue: '2026-03-10',
        due: '2026-03-24',
        buyerRef: '991-12345-73',
        period: { 'cbc:StartDate': '2026-03-03', 'cbc:EndDate': '2026-03-04' },
        seller,
        buyer: {
          name: 'Demo Stadtverwaltung Musterstadt',
          street: 'Rathausplatz 1',
          city: 'Musterstadt',
          zip: '12345',
          email: 'rechnungseingang@demo-kommune.example',
        },
        iban: 'DE89370400440532013000',
        lines: [line(1, 4, 'HUR', 'Tontechnik Betreuung', 75, 19), line(2, 2, 'H87', 'Funkmikrofon', 40, 19)],
        net: 380,
        tax: 72.2,
        gross: 452.2,
      }),
    },
  ]
}
