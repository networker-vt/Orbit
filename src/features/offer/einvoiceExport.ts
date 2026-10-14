import { buildEInvoiceUbl } from './einvoiceMapper'
import type { InvoiceDraft, OfferLineItem, StoredOffer } from './types'
import { KLEINUNTERNEHMER_HINT } from './types'
import { lineTotals, retentionNoteFor, taxBreakdown } from './ustg14'

const silentLogger = { log: () => {}, warn: () => {}, error: () => {} }

export async function exportXRechnungXml(
  offer: StoredOffer,
  invoice: InvoiceDraft,
  lines: OfferLineItem[],
): Promise<string> {
  const { InvoiceService } = await import('@e-invoice-eu/core')
  const payload = buildEInvoiceUbl(offer, invoice, lines)
  const svc = new InvoiceService(silentLogger)
  const out = await svc.generate(payload as never, { format: 'XRECHNUNG-UBL', lang: 'de-de' })
  return typeof out === 'string' ? out : new TextDecoder().decode(out)
}

export async function exportZugferdPdf(
  offer: StoredOffer,
  invoice: InvoiceDraft,
  lines: OfferLineItem[],
): Promise<Uint8Array> {
  const [{ InvoiceService }, { PDFDocument, StandardFonts }] = await Promise.all([
    import('@e-invoice-eu/core'),
    import('@cantoo/pdf-lib'),
  ])
  const payload = buildEInvoiceUbl(offer, invoice, lines)
  const doc = await PDFDocument.create()
  const page = doc.addPage()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const { net, tax, gross } = lineTotals(lines)
  const breakdown = taxBreakdown(lines)
  let y = 780
  const line = (text: string, size = 10) => {
    page.drawText(text.slice(0, 90), { x: 40, y, size, font })
    y -= size + 4
  }
  line(`Rechnung ${invoice.invoiceNumber}`, 16)
  line(`${invoice.seller.name} → ${invoice.buyer.name}`)
  line(`Leistungszeitraum: ${offer.servicePeriodStart} – ${offer.servicePeriodEnd}`)
  line(`Netto ${net.toFixed(2)} EUR · USt ${tax.toFixed(2)} EUR · Brutto ${gross.toFixed(2)} EUR`)
  for (const row of breakdown) {
    line(`Entgelt ${row.rate}%: ${row.net.toFixed(2)} EUR · Steuer: ${row.tax.toFixed(2)} EUR`)
  }
  if (invoice.kleinunternehmer) line(KLEINUNTERNEHMER_HINT, 9)
  const retention = retentionNoteFor(invoice)
  if (retention) line(retention, 9)
  line('ZUGFeRD / Factur-X (eingebettete XRechnung-XML)', 9)
  const pdfBytes = await doc.save()
  const svc = new InvoiceService(silentLogger)
  const out = await svc.generate(payload as never, {
    format: 'factur-x-xrechnung',
    lang: 'de-de',
    pdf: {
      buffer: pdfBytes,
      filename: `${invoice.invoiceNumber.replace(/[^\w-]+/g, '_')}.pdf`,
      mimetype: 'application/pdf',
    },
  })
  return out instanceof Uint8Array ? out : new TextEncoder().encode(String(out))
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
