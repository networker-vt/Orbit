/**
 * Shared Home Schnellzugriffe (user pins from Mein Orbit).
 *
 * One list for Home + Mein — do not invent a second key.
 * Storage: localStorage `orbit_home_pins_v1`
 * Event: `orbit-home-pins` (+ `storage` for other tabs)
 *
 * Mein writes via setHomePins / toggleHomePin / addHomePin / removeHomePin.
 * Home reads via getHomePins + subscribeHomePins and renders `<HomePins />`.
 */

export const HOME_PINS_KEY = 'orbit_home_pins_v1'
export const HOME_PINS_EVT = 'orbit-home-pins'
/** Soft cap so Home stays scannable. Mein should enforce the same. */
export const HOME_PINS_MAX = 8

export type HomePin = {
  /** Stable id (tile id or path slug), e.g. `parkmerke`, `abflug`. */
  id: string
  /** In-app path, e.g. `/parkmerke`. */
  to: string
  /** Visible label (already localized by the writer). */
  label: string
  /** Optional emoji mark. */
  emoji?: string
}

function normalizePin(raw: unknown): HomePin | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  const to = typeof o.to === 'string' ? o.to.trim() : ''
  const label = typeof o.label === 'string' ? o.label.trim() : ''
  if (!id || !to.startsWith('/') || !label) return null
  if (to.startsWith('//') || to.includes('://')) return null
  const emoji = typeof o.emoji === 'string' && o.emoji.trim() ? o.emoji.trim() : undefined
  return { id, to, label, emoji }
}

function sanitize(list: unknown): HomePin[] {
  if (!Array.isArray(list)) return []
  const out: HomePin[] = []
  const seen = new Set<string>()
  for (const item of list) {
    const pin = normalizePin(item)
    if (!pin || seen.has(pin.id)) continue
    seen.add(pin.id)
    out.push(pin)
    if (out.length >= HOME_PINS_MAX) break
  }
  return out
}

function load(): HomePin[] {
  try {
    const raw = localStorage.getItem(HOME_PINS_KEY)
    if (!raw) return []
    return sanitize(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

let cache: HomePin[] | null = null

function get(): HomePin[] {
  if (!cache) cache = load()
  return cache
}

function commit(next: HomePin[]) {
  cache = next
  try {
    localStorage.setItem(HOME_PINS_KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HOME_PINS_EVT))
  }
}

export function getHomePins(): HomePin[] {
  return [...get()]
}

/** Replace the whole pin list (Mein editor save). */
export function setHomePins(pins: HomePin[]): HomePin[] {
  const next = sanitize(pins)
  commit(next)
  return [...next]
}

export function addHomePin(pin: HomePin): HomePin[] {
  const clean = normalizePin(pin)
  if (!clean) return getHomePins()
  const without = get().filter((p) => p.id !== clean.id)
  return setHomePins([clean, ...without])
}

export function removeHomePin(id: string): HomePin[] {
  return setHomePins(get().filter((p) => p.id !== id))
}

/** Pin if missing, unpin if present. */
export function toggleHomePin(pin: HomePin): { pins: HomePin[]; pinned: boolean } {
  const clean = normalizePin(pin)
  if (!clean) return { pins: getHomePins(), pinned: false }
  if (get().some((p) => p.id === clean.id)) {
    return { pins: removeHomePin(clean.id), pinned: false }
  }
  return { pins: addHomePin(clean), pinned: true }
}

export function isHomePinned(id: string): boolean {
  return get().some((p) => p.id === id)
}

export function subscribeHomePins(cb: () => void) {
  const handler = () => {
    cache = null
    cb()
  }
  window.addEventListener(HOME_PINS_EVT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(HOME_PINS_EVT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function resetHomePins() {
  commit([])
}
