export type OfferTaxRate = 0 | 7 | 19

export type OfferLineItem = {
  id: string
  quantity: number
  unit: string
  unitCode: string
  description: string
  unitPriceNet: number
  taxRate: OfferTaxRate | null
  confirmed: boolean
}

export type OfferCaptureKind = 'photo' | 'dictation'

export type StoredOffer = {
  id: string
  createdAt: number
  updatedAt: number
  captureKind: OfferCaptureKind
  title: string
  lines: OfferLineItem[]
  servicePeriodStart: string
  servicePeriodEnd: string
  synced: boolean
  /** Baustellenfotos — nur auf dem Gerät. */
  sitePhotos?: SitePhoto[]
}

export type InvoiceParty = {
  name: string
  street: string
  postCode: string
  city: string
  countryCode: 'DE'
  email: string
  vatId: string
  taxNumber: string
  contactName: string
  contactPhone: string
}

export type InvoiceDraft = {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  buyerReference: string
  iban: string
  bic: string
  seller: InvoiceParty
  buyer: InvoiceParty
  buyerIsPrivatePerson: boolean
  bauGrundstueckLeistung: boolean
  kleinunternehmer: boolean
  customerId: string | null
  publicBuyer: boolean
  leitwegId: string
}

/** Device-only company profile (IndexedDB). Copied into every offer/invoice. */
export type CompanyProfile = {
  name: string
  street: string
  postCode: string
  city: string
  countryCode: 'DE'
  email: string
  taxNumber: string
  vatId: string
  iban: string
  bic: string
  logoDataUrl: string
  kleinunternehmer: boolean
  contactName: string
  contactPhone: string
}

export type InvoiceLifecycle = 'draft' | 'exported' | 'cancelled'

/** Payment status (device-only reminders). */
export type InvoicePaymentStatus = 'offen' | 'bezahlt' | 'ueberfaellig'

export type TaxBreakdownRow = {
  rate: number
  net: number
  tax: number
}

export type SitePhoto = {
  id: string
  dataUrl: string
  createdAt: number
}

export type StoredCustomer = {
  id: string
  createdAt: number
  updatedAt: number
  name: string
  street: string
  postCode: string
  city: string
  email: string
  vatId: string
  taxNumber: string
  contactName: string
  contactPhone: string
  /** öffentlicher Auftraggeber → Leitweg-ID Pflicht (BT-10). */
  publicBuyer: boolean
  leitwegId: string
}

/** Fixed-price Leistungs-/Materialliste entry. */
export type CatalogItem = {
  id: string
  label: string
  unit: string
  unitCode: string
  unitPriceNet: number
  defaultTaxRate: OfferTaxRate | null
}

export type StoredInvoice = {
  id: string
  offerId: string
  createdAt: number
  updatedAt: number
  invoiceNumber: string
  issueDate: string
  dueDate: string
  buyerReference: string
  iban: string
  bic: string
  seller: InvoiceParty
  buyer: InvoiceParty
  lines: OfferLineItem[]
  servicePeriodStart: string
  servicePeriodEnd: string
  status: InvoiceLifecycle
  cancelledAt?: number
  replacementOfId?: string
  buyerIsPrivatePerson: boolean
  bauGrundstueckLeistung: boolean
  kleinunternehmer: boolean
  totals: { net: number; tax: number; gross: number }
  taxBreakdown: TaxBreakdownRow[]
  /** Snapshot note when private person + Bau/Grundstück (§14 Abs.4 Nr.9). */
  retentionNote: string | null
  paymentStatus: InvoicePaymentStatus
  /** Local reminder timestamp (device-only). */
  reminderAt: number | null
  customerId: string | null
  publicBuyer: boolean
  leitwegId: string
}

export type InvoiceCounterState = {
  /** Last allocated sequential number (never decreases on import). */
  lastSeq: number
  prefix: string
}

export type OfferBackupPayload = {
  version: 1 | 2
  exportedAt: string
  offers: StoredOffer[]
  invoices: StoredInvoice[]
  companyProfile: CompanyProfile | null
  invoiceCounter: InvoiceCounterState
  businessConsent: { accepted: true; acceptedAt: number } | null
  customers?: StoredCustomer[]
  catalogItems?: CatalogItem[]
}

export const SITE_PHOTO_FIRST_HINT =
  'Achten Sie auf Personen und Kennzeichen im Bild.' as const

/** Bund portals for XRechnung (no upload from app). */
export const LEITWEG_HINT_BUND =
  'Für den Bund: nutzen Sie das Portal ZRE bzw. OZG-RE (kein Upload aus dieser App).' as const
export const LEITWEG_HINT_LAND =
  'Für Land/Kommune: nutzen Sie das jeweilige Landes- oder Kommunalportal (kein Upload aus dieser App).' as const
export const LEITWEG_URL_ZRE = 'https://xrechnung.bund.de/' as const
export const LEITWEG_URL_OZG_RE = 'https://xrechnung-bdr.de/' as const

export type AiAnalysisInput =
  | { kind: 'photo'; file: File }
  | { kind: 'dictation'; transcript: string }

export type AiAnalysisResult = {
  lines: Omit<OfferLineItem, 'id' | 'confirmed'>[]
  title: string
}

export type AiQueueJob = {
  id: string
  offerId: string
  inputKind: OfferCaptureKind
  createdAt: number
  payload: { fileName?: string; transcript?: string }
}

export const KLEINUNTERNEHMER_HINT =
  'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.' as const

export const RETENTION_NOTE_PRIVATE_BAU =
  'Bitte bewahren Sie diese Rechnung zwei Jahre auf.' as const

export const BACKUP_ARCHIVE_HINT =
  'Bitte sichern Sie Ihre Daten regelmäßig. Die App ersetzt keine revisionssichere Archivierung.' as const
