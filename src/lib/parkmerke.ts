/**
 * One parking memory on this device: photo, own pin, and a timer.
 * Pure rules. No network, no storage, no map tiles.
 */

export const PARK_PRESETS_MIN = [30, 60, 90, 120] as const
export type ParkPreset = (typeof PARK_PRESETS_MIN)[number]

/** On-screen warning this long before the timer ends. */
export const WARN_BEFORE_MS = 10 * 60 * 1000

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024

export const PARK_ZOOM = 17

export const OSM_TILE_HOST = 'tile.openstreetmap.org'

export interface ParkingSpot {
  photo: Blob
  lat: number
  lng: number
  accuracy: number | null
  endsAt: number
  savedAt: number
  warned: boolean
}

export interface SpotDraft {
  photo: Blob
  lat: number
  lng: number
  accuracy: number | null
  endsAt: number
}

export type SaveDecision =
  | { action: 'save'; spot: ParkingSpot; replaced: boolean }
  | { action: 'needs-confirm' }
  | { action: 'reject'; reason: 'photo' | 'pin' | 'time' }

export function endAtFromMinutes(now: number, minutes: number): number | null {
  if (!PARK_PRESETS_MIN.includes(minutes as ParkPreset)) return null
  return now + minutes * 60_000
}

/** `datetime-local` value, interpreted in the device timezone. Must be in the future. */
export function endAtFromCustom(value: string, now: number): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const ms = new Date(value).getTime()
  if (!Number.isFinite(ms) || ms <= now) return null
  return ms
}

export function remainingMs(endsAt: number, now: number): number {
  return endsAt - now
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatEnd(endsAt: number): string {
  return new Date(endsAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatPin(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export type WarningPhase = 'none' | 'soon' | 'over'

export function warningPhase(endsAt: number, now: number, lead = WARN_BEFORE_MS): WarningPhase {
  const left = endsAt - now
  if (left <= 0) return 'over'
  if (left <= lead) return 'soon'
  return 'none'
}

/**
 * A local notification only when the browser already allows it.
 * This does not ask for permission and does not use a push server.
 */
export function shouldSendLocalWarning(
  permission: NotificationPermission | 'unsupported' | 'denied' | 'default' | 'granted',
  phase: WarningPhase,
  alreadySent: boolean,
): boolean {
  return permission === 'granted' && phase === 'soon' && !alreadySent
}

function photoOk(photo: Blob | null | undefined): photo is Blob {
  if (!(photo instanceof Blob)) return false
  if (photo.size <= 0 || photo.size > MAX_PHOTO_BYTES) return false
  if (photo.type && !photo.type.startsWith('image/')) return false
  return true
}

function pinOk(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180
}

/**
 * A stored spot stays until the person confirms the replacement.
 * `confirmed` is ignored when nothing is stored yet.
 */
export function decideSave(
  current: ParkingSpot | null,
  draft: SpotDraft,
  confirmed: boolean,
  now: number,
): SaveDecision {
  if (!photoOk(draft.photo)) return { action: 'reject', reason: 'photo' }
  if (!pinOk(draft.lat, draft.lng)) return { action: 'reject', reason: 'pin' }
  if (!Number.isFinite(draft.endsAt) || draft.endsAt <= now) return { action: 'reject', reason: 'time' }
  if (current && !confirmed) return { action: 'needs-confirm' }
  return {
    action: 'save',
    replaced: current != null,
    spot: {
      photo: draft.photo,
      lat: draft.lat,
      lng: draft.lng,
      accuracy: Number.isFinite(draft.accuracy) ? draft.accuracy : null,
      endsAt: draft.endsAt,
      savedAt: now,
      warned: false,
    },
  }
}

export function latLngToWorld(lat: number, lng: number, zoom: number): { fx: number; fy: number; x: number; y: number } {
  const n = 2 ** zoom
  const fx = ((lng + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const fy = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { fx, fy, x: Math.floor(fx), y: Math.floor(fy) }
}

export function tilesForPin(
  lat: number,
  lng: number,
  zoom = PARK_ZOOM,
): { z: number; x: number; y: number }[] {
  const { x, y } = latLngToWorld(lat, lng, zoom)
  const n = 2 ** zoom
  const tiles: { z: number; x: number; y: number }[] = []
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const tx = x + dx
      const ty = y + dy
      if (tx < 0 || ty < 0 || tx >= n || ty >= n) continue
      tiles.push({ z: zoom, x: tx, y: ty })
    }
  }
  return tiles
}

/** Image GET for one OSM tile. No query string, so the raw coordinates are not in the URL. */
export function osmTileUrl(z: number, x: number, y: number): string {
  if (![z, x, y].every((n) => Number.isInteger(n) && n >= 0)) {
    throw new Error('tile')
  }
  return `https://${OSM_TILE_HOST}/${z}/${x}/${y}.png`
}

export function isOsmTileGet(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.host === OSM_TILE_HOST &&
    parsed.search === '' &&
    parsed.hash === '' &&
    parsed.username === '' &&
    parsed.password === '' &&
    /^\/\d+\/\d+\/\d+\.png$/.test(parsed.pathname)
  )
}

/** True when a request body or URL carries the photo or the raw coordinates. */
export function requestCarriesSpot(
  url: string,
  body: unknown,
  spot: { lat: number; lng: number; photo?: Blob | null },
): boolean {
  if (body != null && body !== '') return true
  const hay = String(url)
  if (hay.includes(String(spot.lat)) || hay.includes(String(spot.lng))) return true
  if (spot.photo && hay.includes('photo')) return true
  return !isOsmTileGet(hay) && hay.length > 0
}
