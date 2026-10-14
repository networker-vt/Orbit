import { buildEInvoiceUbl } from './einvoiceMapper'
import type { InvoiceDraft, OfferLineItem, StoredOffer } from './types'
import { lineTotals } from './ustg14'

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
  page.drawText(`Rechnung ${invoice.invoiceNumber}`, { x: 40, y: 780, size: 16, font })
  page.drawText(`${invoice.seller.name} → ${invoice.buyer.name}`, { x: 40, y: 760, size: 10, font })
  page.drawText(`Netto ${net.toFixed(2)} EUR · USt ${tax.toFixed(2)} EUR · Brutto ${gross.toFixed(2)} EUR`, {
    x: 40,
    y: 740,
    size: 10,
    font,
  })
  page.drawText('ZUGFeRD / Factur-X ( eingebettete XRechnung-XML )', { x: 40, y: 720, size: 9, font })
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
