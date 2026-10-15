/**
 * GiroCode (EPC-QR) for SEPA transfers.
 * QR library loaded only via dynamic import on click/export.
 * No QR only when amount is 0 €. Kleinunternehmer get QR normally (amount without USt).
 */
import type { CompanyProfile, InvoiceDraft } from './types'

export type GiroCodeInput = {
  iban: string
  bic: string
  recipientName: string
  amountEur: number
  purpose: string
}

/** EPC069-12 / GiroCode payload (BCD). */
export function buildEpcPayload(input: GiroCodeInput): string | null {
  if (!(input.amountEur > 0)) return null
  const iban = input.iban.replace(/\s/g, '').toUpperCase()
  if (!iban) return null
  const name = input.recipientName.trim().slice(0, 70)
  const purpose = input.purpose.trim().slice(0, 140)
  const amount = `EUR${input.amountEur.toFixed(2)}`
  const bic = input.bic.replace(/\s/g, '').toUpperCase()
  // BCD\n002\n1\nSCT\nBIC\nName\nIBAN\nAmount\n\n\nPurpose
  return ['BCD', '002', '1', 'SCT', bic, name, iban, amount, '', '', purpose].join('\n')
}

export function giroCodeFromInvoice(
  invoice: InvoiceDraft,
  amountEur: number,
  profile: CompanyProfile | null,
): string | null {
  // IBAN from own company profile only (fallback to invoice IBAN filled from profile).
  const iban = (profile?.iban || invoice.iban).replace(/\s/g, '')
  return buildEpcPayload({
    iban,
    bic: profile?.bic || invoice.bic,
    recipientName: profile?.name || invoice.seller.name,
    amountEur,
    purpose: invoice.invoiceNumber,
  })
}

/** Dynamic import of qrcode — call only when embedding on PDF. */
export async function renderGiroCodePng(
  payload: string,
  size = 160,
): Promise<Uint8Array | null> {
  const QRCode = await import('qrcode')
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    type: 'image/png',
  })
  const base64 = dataUrl.split(',')[1]
  if (!base64) return null
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
