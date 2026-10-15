import { allocateInvoiceNumber, newInvoiceId, saveInvoice } from './offerDb'
import type { CompanyProfile, InvoiceDraft, OfferLineItem, StoredInvoice, StoredOffer } from './types'
import { applyProfileToInvoice } from './companyProfile'
import { lineTotals, retentionNoteFor, taxBreakdown } from './ustg14'

function emptyBuyer(): InvoiceDraft['buyer'] {
  return {
    name: '',
    street: '',
    postCode: '',
    city: '',
    countryCode: 'DE',
    email: '',
    vatId: '',
    taxNumber: '',
    contactName: '',
    contactPhone: '',
  }
}

export function blankInvoiceDraft(profile: CompanyProfile | null): InvoiceDraft {
  const today = new Date()
  const issue = today.toISOString().slice(0, 10)
  const due = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10)
  const base: InvoiceDraft = {
    invoiceNumber: '',
    issueDate: issue,
    dueDate: due,
    buyerReference: '',
    iban: '',
    bic: '',
    seller: emptyBuyer(),
    buyer: emptyBuyer(),
    buyerIsPrivatePerson: false,
    bauGrundstueckLeistung: false,
    kleinunternehmer: false,
    customerId: null,
    publicBuyer: false,
    leitwegId: '',
  }
  return profile ? applyProfileToInvoice(base, profile) : base
}

/**
 * One-tap Angebot → Rechnung: copy lines, allocate unique sequential number, set date.
 */
export async function convertOfferToInvoiceDraft(
  _offer: StoredOffer,
  profile: CompanyProfile | null,
): Promise<InvoiceDraft> {
  // Lines stay on the StoredOffer; this allocates a unique number + date only.
  void _offer
  const draft = blankInvoiceDraft(profile)
  const invoiceNumber = await allocateInvoiceNumber()
  return {
    ...draft,
    invoiceNumber,
    issueDate: new Date().toISOString().slice(0, 10),
  }
}

export function buildStoredInvoiceFromDraft(
  offer: StoredOffer,
  invoice: InvoiceDraft,
  lines: OfferLineItem[],
  opts?: { replacementOfId?: string; status?: StoredInvoice['status'] },
): StoredInvoice {
  const confirmed = lines.filter((l) => l.confirmed)
  const now = Date.now()
  return {
    id: newInvoiceId(),
    offerId: offer.id,
    createdAt: now,
    updatedAt: now,
    invoiceNumber: invoice.invoiceNumber.trim(),
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    buyerReference: invoice.buyerReference,
    iban: invoice.iban,
    bic: invoice.bic,
    seller: { ...invoice.seller },
    buyer: { ...invoice.buyer },
    lines: confirmed.map((l) => ({ ...l })),
    servicePeriodStart: offer.servicePeriodStart,
    servicePeriodEnd: offer.servicePeriodEnd,
    status: opts?.status ?? 'draft',
    replacementOfId: opts?.replacementOfId,
    buyerIsPrivatePerson: invoice.buyerIsPrivatePerson,
    bauGrundstueckLeistung: invoice.bauGrundstueckLeistung,
    kleinunternehmer: invoice.kleinunternehmer,
    totals: lineTotals(confirmed),
    taxBreakdown: taxBreakdown(confirmed),
    retentionNote: retentionNoteFor(invoice),
    paymentStatus: 'offen',
    reminderAt: null,
    customerId: invoice.customerId,
    publicBuyer: invoice.publicBuyer,
    leitwegId: invoice.leitwegId,
  }
}

/** Persist invoice as exported (read-only thereafter; changes only via Storno + neue Rechnung). */
export async function markInvoiceExported(stored: StoredInvoice): Promise<StoredInvoice> {
  const next: StoredInvoice = {
    ...stored,
    status: 'exported',
    updatedAt: Date.now(),
  }
  await saveInvoice(next)
  return next
}

export function storedInvoiceToDraft(inv: StoredInvoice): InvoiceDraft {
  return {
    invoiceNumber: inv.invoiceNumber,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    buyerReference: inv.buyerReference,
    iban: inv.iban,
    bic: inv.bic,
    seller: { ...inv.seller },
    buyer: { ...inv.buyer },
    buyerIsPrivatePerson: inv.buyerIsPrivatePerson,
    bauGrundstueckLeistung: inv.bauGrundstueckLeistung,
    kleinunternehmer: inv.kleinunternehmer,
    customerId: inv.customerId ?? null,
    publicBuyer: inv.publicBuyer ?? false,
    leitwegId: inv.leitwegId ?? '',
  }
}

export function storedInvoiceAsOfferSlice(inv: StoredInvoice): StoredOffer {
  return {
    id: inv.offerId,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    captureKind: 'dictation',
    title: `Rechnung ${inv.invoiceNumber}`,
    lines: inv.lines,
    servicePeriodStart: inv.servicePeriodStart,
    servicePeriodEnd: inv.servicePeriodEnd,
    synced: false,
  }
}

/**
 * Storno + neue Rechnung: cancel old, allocate new number, copy lines into editable draft.
 */
export async function stornoAndNewInvoice(
  cancelled: StoredInvoice,
  profile: CompanyProfile | null,
): Promise<{ draft: InvoiceDraft; offerSlice: StoredOffer; cancelled: StoredInvoice }> {
  const { cancelInvoice } = await import('./offerDb')
  const nextCancelled = (await cancelInvoice(cancelled.id)) ?? cancelled
  const draft = await convertOfferToInvoiceDraft(storedInvoiceAsOfferSlice(cancelled), profile)
  draft.buyer = { ...cancelled.buyer }
  draft.buyerReference = cancelled.buyerReference
  draft.buyerIsPrivatePerson = cancelled.buyerIsPrivatePerson
  draft.bauGrundstueckLeistung = cancelled.bauGrundstueckLeistung
  draft.dueDate = cancelled.dueDate
  draft.customerId = cancelled.customerId ?? null
  draft.publicBuyer = cancelled.publicBuyer ?? false
  draft.leitwegId = cancelled.leitwegId ?? ''
  return {
    draft,
    offerSlice: {
      ...storedInvoiceAsOfferSlice(cancelled),
      id: cancelled.offerId,
      lines: cancelled.lines.map((l) => ({ ...l, confirmed: true })),
    },
    cancelled: nextCancelled,
  }
}
