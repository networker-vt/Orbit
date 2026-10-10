/**
 * The one active spot, on this device only.
 * IndexedDB. This module does not use the network.
 */
import { decideSave, type ParkingSpot, type SpotDraft } from './parkmerke'

interface SpotRecord {
  photo64: string
  photoType: string
  lat: number
  lng: number
  accuracy: number | null
  endsAt: number
  savedAt: number
  warned: boolean
}

function encodeBytes(bytes: Uint8Array): string {
  let binary = ''
  const size = 0x8000
  for (let i = 0; i < bytes.length; i += size) {
    binary += String.fromCharCode(...bytes.subarray(i, i + size))
  }
  return btoa(binary)
}

function decodeBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function toRecord(spot: ParkingSpot): Promise<SpotRecord> {
  const raw = new Uint8Array(await spot.photo.arrayBuffer())
  return {
    photo64: encodeBytes(raw),
    photoType: spot.photo.type || 'image/jpeg',
    lat: spot.lat,
    lng: spot.lng,
    accuracy: spot.accuracy,
    endsAt: spot.endsAt,
    savedAt: spot.savedAt,
    warned: spot.warned,
  }
}

function fromRecord(record: SpotRecord | undefined): ParkingSpot | null {
  if (!record || typeof record.photo64 !== 'string' || record.photo64.length === 0) return null
  if (!Number.isFinite(record.lat) || !Number.isFinite(record.lng) || !Number.isFinite(record.endsAt)) return null
  const bytes = decodeBytes(record.photo64)
  return {
    photo: new Blob([Uint8Array.from(bytes)], { type: record.photoType || 'image/jpeg' }),
    lat: record.lat,
    lng: record.lng,
    accuracy: record.accuracy ?? null,
    endsAt: record.endsAt,
    savedAt: record.savedAt,
    warned: Boolean(record.warned),
  }
}

const DB_NAME = 'orbit-parkmerke'
const DB_VERSION = 2
const SPOT_KEY = 'active'

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
      if (!db.objectStoreNames.contains('spot')) db.createObjectStore('spot')
      if (db.objectStoreNames.contains('tiles')) db.deleteObjectStore('tiles')
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

async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await openDb()
  try {
    return await fn(db)
  } finally {
    db.close()
  }
}

export async function loadParkingSpot(): Promise<ParkingSpot | null> {
  return withDb(async (db) => {
    const tx = db.transaction('spot', 'readonly')
    const done = txDone(tx)
    const value = await requestDone(tx.objectStore('spot').get(SPOT_KEY) as IDBRequest<SpotRecord | undefined>)
    await done
    return fromRecord(value)
  })
}

async function putSpot(spot: ParkingSpot): Promise<void> {
  const record = await toRecord(spot)
  await withDb(async (db) => {
    const tx = db.transaction('spot', 'readwrite')
    const done = txDone(tx)
    tx.objectStore('spot').put(record, SPOT_KEY)
    await done
  })
}

export type SaveResult =
  | { ok: true; spot: ParkingSpot; replaced: boolean }
  | { ok: false; reason: 'confirm' | 'photo' | 'pin' | 'time' }

/**
 * Writes the spot only when `decideSave` says so.
 * An existing spot is left untouched until `confirmed` is true.
 */
export async function saveParkingSpot(draft: SpotDraft, confirmed: boolean, now = Date.now()): Promise<SaveResult> {
  const current = await loadParkingSpot()
  const decision = decideSave(current, draft, confirmed, now)
  if (decision.action === 'needs-confirm') return { ok: false, reason: 'confirm' }
  if (decision.action === 'reject') return { ok: false, reason: decision.reason }
  await putSpot(decision.spot)
  return { ok: true, spot: decision.spot, replaced: decision.replaced }
}

export async function markParkingWarned(): Promise<void> {
  const spot = await loadParkingSpot()
  if (!spot || spot.warned) return
  await putSpot({ ...spot, warned: true })
}

/** Removes the photo, the pin, and the timer. Map images are not stored. */
export async function deleteParkingSpot(): Promise<void> {
  await withDb(async (db) => {
    const tx = db.transaction('spot', 'readwrite')
    const done = txDone(tx)
    tx.objectStore('spot').delete(SPOT_KEY)
    await done
  })
}

export async function resetParkmerkeStore(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = requireDb().deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })
}
