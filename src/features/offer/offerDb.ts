/**
 * Offline-first offer storage (IndexedDB). Sync is deferred in beta.
 */
import type { StoredOffer } from './types'

const DB_NAME = 'orbit-offers'
const DB_VERSION = 2
const OFFERS = 'offers'
const META = 'meta'
const CONSENT_KEY = 'businessUseBgb14'

export type BusinessConsentRecord = {
  accepted: true
  acceptedAt: number
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

export async function getBusinessConsent(): Promise<BusinessConsentRecord | null> {
  const db = await openDb()
  const tx = db.transaction(META, 'readonly')
  const row = await requestDone(tx.objectStore(META).get(CONSENT_KEY))
  await txDone(tx)
  db.close()
  if (!row || typeof row !== 'object' || (row as BusinessConsentRecord).accepted !== true) return null
  return row as BusinessConsentRecord
}

export async function setBusinessConsentAccepted(): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(META, 'readwrite')
  const record: BusinessConsentRecord = { accepted: true, acceptedAt: Date.now() }
  tx.objectStore(META).put(record, CONSENT_KEY)
  await txDone(tx)
  db.close()
}
