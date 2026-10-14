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
  seller: InvoiceParty
  buyer: InvoiceParty
}

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
