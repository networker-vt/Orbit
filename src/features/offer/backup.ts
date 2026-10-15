/**
 * „Alles sichern“ — ZIP with JSON + per-invoice XML/PDF.
 * Heavy lib (JSZip) loaded only via dynamic import on click.
 */
import {
  getBusinessConsent,
  getCompanyProfile,
  getInvoiceCounter,
  listCatalogItems,
  listCustomers,
  listInvoices,
  listOffers,
  mergeInvoiceCounter,
  replaceAllCatalogItems,
  replaceAllCustomers,
  replaceAllInvoices,
  replaceAllOffers,
  saveCompanyProfile,
  setBusinessConsentAccepted,
} from './offerDb'
import { exportXRechnungXml, exportZugferdPdf } from './einvoiceExport'
import { storedInvoiceAsOfferSlice, storedInvoiceToDraft } from './invoiceConvert'
import type { OfferBackupPayload, StoredInvoice } from './types'
import { BACKUP_ARCHIVE_HINT } from './types'

export { BACKUP_ARCHIVE_HINT }

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => v, 2)
}

export async function buildBackupPayload(): Promise<OfferBackupPayload> {
  const [offers, invoices, companyProfile, invoiceCounter, businessConsent, customers, catalogItems] =
    await Promise.all([
      listOffers(),
      listInvoices(),
      getCompanyProfile(),
      getInvoiceCounter(),
      getBusinessConsent(),
      listCustomers(),
      listCatalogItems(),
    ])
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    offers,
    invoices,
    companyProfile,
    invoiceCounter,
    businessConsent,
    customers,
    catalogItems,
  }
}

async function filesForInvoice(inv: StoredInvoice): Promise<{ xml: string; pdf: Uint8Array } | null> {
  if (inv.status === 'cancelled') return null
  const offer = storedInvoiceAsOfferSlice(inv)
  const draft = storedInvoiceToDraft(inv)
  const xml = await exportXRechnungXml(offer, draft, inv.lines)
  const pdf = await exportZugferdPdf(offer, draft, inv.lines)
  return { xml, pdf }
}

/** Build ZIP (XML, PDF, JSON). Call only on user click — dynamic import. */
export async function exportBackupZip(): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const payload = await buildBackupPayload()
  const zip = new JSZip()
  zip.file('orbit-offer-backup.json', stableStringify(payload))
  zip.file('HINWEIS.txt', BACKUP_ARCHIVE_HINT)

  const folder = zip.folder('invoices')
  for (const inv of payload.invoices) {
    if (inv.status !== 'exported') continue
    try {
      const files = await filesForInvoice(inv)
      if (!files || !folder) continue
      const safe = inv.invoiceNumber.replace(/[^\w.-]+/g, '_')
      folder.file(`${safe}.xml`, files.xml)
      folder.file(`${safe}.pdf`, files.pdf)
    } catch {
      // Skip invoices that fail regeneration; JSON still holds the data.
    }
  }

  return zip.generateAsync({ type: 'blob' })
}

export type ImportBackupResult = {
  offers: number
  invoices: number
  counterLastSeq: number
}

/**
 * Import backup ZIP or JSON. Never resets the invoice counter downward;
 * takes max(current, imported) so numbers stay unique.
 */
export async function importBackupZip(file: File): Promise<ImportBackupResult> {
  const lower = file.name.toLowerCase()
  let payload: OfferBackupPayload

  if (lower.endsWith('.json')) {
    payload = JSON.parse(await file.text()) as OfferBackupPayload
  } else {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    const jsonEntry =
      zip.file('orbit-offer-backup.json') ??
      Object.values(zip.files).find((f) => !f.dir && f.name.endsWith('.json'))
    if (!jsonEntry) throw new Error('Backup enthält keine JSON-Datei')
    payload = JSON.parse(await jsonEntry.async('string')) as OfferBackupPayload
  }

  if (
    (payload.version !== 1 && payload.version !== 2) ||
    !Array.isArray(payload.offers) ||
    !Array.isArray(payload.invoices)
  ) {
    throw new Error('Ungültiges Backup-Format')
  }

  await replaceAllOffers(payload.offers)
  await replaceAllInvoices(payload.invoices)
  if (payload.companyProfile) await saveCompanyProfile(payload.companyProfile)
  await mergeInvoiceCounter(payload.invoiceCounter)
  if (payload.businessConsent?.accepted) {
    await setBusinessConsentAccepted(payload.businessConsent.acceptedAt)
  }
  if (Array.isArray(payload.customers)) await replaceAllCustomers(payload.customers)
  if (Array.isArray(payload.catalogItems)) await replaceAllCatalogItems(payload.catalogItems)

  const counter = await getInvoiceCounter()
  return {
    offers: payload.offers.length,
    invoices: payload.invoices.length,
    counterLastSeq: counter.lastSeq,
  }
}

/** Normalize for round-trip equality tests (ignore exportedAt). */
export function normalizeBackupForCompare(payload: OfferBackupPayload): string {
  const clone: OfferBackupPayload = {
    ...payload,
    exportedAt: '',
    offers: [...payload.offers].sort((a, b) => a.id.localeCompare(b.id)),
    invoices: [...payload.invoices].sort((a, b) => a.id.localeCompare(b.id)),
    customers: [...(payload.customers ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
    catalogItems: [...(payload.catalogItems ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
  }
  return stableStringify(clone)
}

export async function roundTripBackupIdentical(): Promise<boolean> {
  const before = await buildBackupPayload()
  const blob = await exportBackupZip()
  const file = new File([blob], 'test-backup.zip', { type: 'application/zip' })
  await importBackupZip(file)
  const after = await buildBackupPayload()
  return normalizeBackupForCompare(before) === normalizeBackupForCompare(after)
}
