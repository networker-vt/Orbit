/**
 * Offline-first offer storage (IndexedDB). Sync is deferred in beta.
 * Device-only: company profile, invoices, sequential invoice numbers.
 */
import type {
  CatalogItem,
  CompanyProfile,
  InvoiceCounterState,
  StoredCustomer,
  StoredInvoice,
  StoredOffer,
} from './types'

const DB_NAME = 'orbit-offers'
const DB_VERSION = 4
const OFFERS = 'offers'
const INVOICES = 'invoices'
const CUSTOMERS = 'customers'
const CATALOG = 'catalog'
const META = 'meta'

const CONSENT_KEY = 'businessUseBgb14'
const PROFILE_KEY = 'companyProfile'
const COUNTER_KEY = 'invoiceCounter'

export type BusinessConsentRecord = {
  accepted: true
  acceptedAt: number
}

const DEFAULT_COUNTER: InvoiceCounterState = {
  lastSeq: 0,
  prefix: 'RE',
}

export function emptyCompanyProfile(): CompanyProfile {
  return {
    name: '',
    street: '',
    postCode: '',
    city: '',
    countryCode: 'DE',
    email: '',
    taxNumber: '',
    vatId: '',
    iban: '',
    bic: '',
    logoDataUrl: '',
    kleinunternehmer: false,
    contactName: '',
    contactPhone: '',
  }
}

function requireDb(): IDBFactory {
  const factory = globalThis.indexedDB
  if (!factory) throw new Error('indexedDB')
  return factory
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = requireDb().open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(OFFERS)) {
        db.createObjectStore(OFFERS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(INVOICES)) {
        db.createObjectStore(INVOICES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(CUSTOMERS)) {
        db.createObjectStore(CUSTOMERS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(CATALOG)) {
        db.createObjectStore(CATALOG, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function requestDone<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('abort'))
  })
}

export async function saveOffer(offer: StoredOffer): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(OFFERS, 'readwrite')
  tx.objectStore(OFFERS).put(offer)
  await txDone(tx)
  db.close()
}

export async function getOffer(id: string): Promise<StoredOffer | null> {
  const db = await openDb()
  const tx = db.transaction(OFFERS, 'readonly')
  const row = await requestDone(tx.objectStore(OFFERS).get(id))
  await txDone(tx)
  db.close()
  return row ?? null
}

export async function listOffers(): Promise<StoredOffer[]> {
  const db = await openDb()
  const tx = db.transaction(OFFERS, 'readonly')
  const rows = await requestDone(tx.objectStore(OFFERS).getAll())
  await txDone(tx)
  db.close()
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function newOfferId(): string {
  return `off-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function newInvoiceId(): string {
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function getBusinessConsent(): Promise<BusinessConsentRecord | null> {
  const db = await openDb()
  const tx = db.transaction(META, 'readonly')
  const row = await requestDone(tx.objectStore(META).get(CONSENT_KEY))
  await txDone(tx)
  db.close()
  if (!row || typeof row !== 'object' || (row as BusinessConsentRecord).accepted !== true) return null
  return row as BusinessConsentRecord
}

export async function setBusinessConsentAccepted(
  acceptedAt: number = Date.now(),
): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(META, 'readwrite')
  const record: BusinessConsentRecord = { accepted: true, acceptedAt }
  tx.objectStore(META).put(record, CONSENT_KEY)
  await txDone(tx)
  db.close()
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const db = await openDb()
  const tx = db.transaction(META, 'readonly')
  const row = await requestDone(tx.objectStore(META).get(PROFILE_KEY))
  await txDone(tx)
  db.close()
  if (!row || typeof row !== 'object') return null
  return row as CompanyProfile
}

export async function saveCompanyProfile(profile: CompanyProfile): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(META, 'readwrite')
  tx.objectStore(META).put(profile, PROFILE_KEY)
  await txDone(tx)
  db.close()
}

export async function getInvoiceCounter(): Promise<InvoiceCounterState> {
  const db = await openDb()
  const tx = db.transaction(META, 'readonly')
  const row = await requestDone(tx.objectStore(META).get(COUNTER_KEY))
  await txDone(tx)
  db.close()
  if (!row || typeof row !== 'object') return { ...DEFAULT_COUNTER }
  const c = row as InvoiceCounterState
  return {
    lastSeq: typeof c.lastSeq === 'number' && c.lastSeq >= 0 ? c.lastSeq : 0,
    prefix: typeof c.prefix === 'string' && c.prefix.trim() ? c.prefix : DEFAULT_COUNTER.prefix,
  }
}

async function putInvoiceCounter(counter: InvoiceCounterState): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(META, 'readwrite')
  tx.objectStore(META).put(counter, COUNTER_KEY)
  await txDone(tx)
  db.close()
}

/**
 * Allocates the next unique sequential invoice number.
 * Import must use mergeInvoiceCounter so the counter never resets downward.
 */
export async function allocateInvoiceNumber(): Promise<string> {
  const current = await getInvoiceCounter()
  const next: InvoiceCounterState = {
    ...current,
    lastSeq: current.lastSeq + 1,
  }
  await putInvoiceCounter(next)
  const year = new Date().getFullYear()
  return `${next.prefix}-${year}-${String(next.lastSeq).padStart(4, '0')}`
}

/**
 * Merge imported counter: keep the higher lastSeq so import never resets or duplicates.
 */
export async function mergeInvoiceCounter(imported: InvoiceCounterState | null | undefined): Promise<void> {
  if (!imported) return
  const current = await getInvoiceCounter()
  const merged: InvoiceCounterState = {
    prefix: current.prefix || imported.prefix || DEFAULT_COUNTER.prefix,
    lastSeq: Math.max(current.lastSeq, imported.lastSeq ?? 0),
  }
  await putInvoiceCounter(merged)
}

/** Test/helper: set counter explicitly (never used to lower on import path). */
export async function setInvoiceCounterForTests(counter: InvoiceCounterState): Promise<void> {
  await putInvoiceCounter(counter)
}

export async function saveInvoice(invoice: StoredInvoice): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(INVOICES, 'readwrite')
  tx.objectStore(INVOICES).put(invoice)
  await txDone(tx)
  db.close()
}

export async function getInvoice(id: string): Promise<StoredInvoice | null> {
  const db = await openDb()
  const tx = db.transaction(INVOICES, 'readonly')
  const row = await requestDone(tx.objectStore(INVOICES).get(id))
  await txDone(tx)
  db.close()
  return row ?? null
}

export async function listInvoices(): Promise<StoredInvoice[]> {
  const db = await openDb()
  const tx = db.transaction(INVOICES, 'readonly')
  const rows = await requestDone(tx.objectStore(INVOICES).getAll())
  await txDone(tx)
  db.close()
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function replaceAllOffers(offers: StoredOffer[]): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(OFFERS, 'readwrite')
  const store = tx.objectStore(OFFERS)
  store.clear()
  for (const offer of offers) store.put(offer)
  await txDone(tx)
  db.close()
}

export async function replaceAllInvoices(invoices: StoredInvoice[]): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(INVOICES, 'readwrite')
  const store = tx.objectStore(INVOICES)
  store.clear()
  for (const inv of invoices) store.put(inv)
  await txDone(tx)
  db.close()
}

export async function cancelInvoice(id: string): Promise<StoredInvoice | null> {
  const inv = await getInvoice(id)
  if (!inv || inv.status === 'cancelled') return inv
  const next: StoredInvoice = {
    ...inv,
    status: 'cancelled',
    cancelledAt: Date.now(),
    updatedAt: Date.now(),
  }
  await saveInvoice(next)
  return next
}

export function newCustomerId(): string {
  return `cus-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function saveCustomer(customer: StoredCustomer): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(CUSTOMERS, 'readwrite')
  tx.objectStore(CUSTOMERS).put(customer)
  await txDone(tx)
  db.close()
}

export async function listCustomers(): Promise<StoredCustomer[]> {
  const db = await openDb()
  const tx = db.transaction(CUSTOMERS, 'readonly')
  const rows = await requestDone(tx.objectStore(CUSTOMERS).getAll())
  await txDone(tx)
  db.close()
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export async function getCustomer(id: string): Promise<StoredCustomer | null> {
  const db = await openDb()
  const tx = db.transaction(CUSTOMERS, 'readonly')
  const row = await requestDone(tx.objectStore(CUSTOMERS).get(id))
  await txDone(tx)
  db.close()
  return row ?? null
}

export async function replaceAllCustomers(customers: StoredCustomer[]): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(CUSTOMERS, 'readwrite')
  const store = tx.objectStore(CUSTOMERS)
  store.clear()
  for (const c of customers) store.put(c)
  await txDone(tx)
  db.close()
}

export async function saveCatalogItem(item: CatalogItem): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(CATALOG, 'readwrite')
  tx.objectStore(CATALOG).put(item)
  await txDone(tx)
  db.close()
}

export async function listCatalogItems(): Promise<CatalogItem[]> {
  const db = await openDb()
  const tx = db.transaction(CATALOG, 'readonly')
  const rows = await requestDone(tx.objectStore(CATALOG).getAll())
  await txDone(tx)
  db.close()
  return rows.sort((a, b) => a.label.localeCompare(b.label, 'de'))
}

export async function replaceAllCatalogItems(items: CatalogItem[]): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(CATALOG, 'readwrite')
  const store = tx.objectStore(CATALOG)
  store.clear()
  for (const item of items) store.put(item)
  await txDone(tx)
  db.close()
}

export async function ensureDefaultCatalog(): Promise<CatalogItem[]> {
  const existing = await listCatalogItems()
  if (existing.length > 0) return existing
  const defaults: CatalogItem[] = [
    {
      id: 'cat-led-par',
      label: 'LED-PAR Scheinwerfer',
      unit: 'Stück',
      unitCode: 'H87',
      unitPriceNet: 18.5,
      defaultTaxRate: null,
    },
    {
      id: 'cat-montage',
      label: 'Montage Traversen',
      unit: 'Std',
      unitCode: 'HUR',
      unitPriceNet: 65,
      defaultTaxRate: null,
    },
    {
      id: 'cat-kabel',
      label: 'DMX-Kabel 10 m',
      unit: 'Stück',
      unitCode: 'H87',
      unitPriceNet: 12,
      defaultTaxRate: null,
    },
    {
      id: 'cat-podest',
      label: 'Bühnenpodest-Paket',
      unit: 'Pauschale',
      unitCode: 'C62',
      unitPriceNet: 890,
      defaultTaxRate: null,
    },
  ]
  for (const item of defaults) await saveCatalogItem(item)
  return defaults
}
