/**
 * User-pinned Schnellzugriffe (Mein Orbit → Startseite).
 * Demo persistence: localStorage.
 */
import { isFlagOn } from './flags'
import { hubCtx, type HubCtx } from './hubTiles'
import { kidsMaySeeJobs } from './kids'

export type PinId =
  | 'kabine'
  | 'parkmerke'
  | 'social'
  | 'jobs'
  | 'match'
  | 'abflug'
  | 'dashboard'

export type PinDef = {
  id: PinId
  to: string
  labelKey: string
  emoji: string
  hide?: (ctx: HubCtx) => boolean
}

const KEY = 'orbit_pinned_shortcuts_v1'
const EVT = 'orbit-pins-changed'
export const MAX_PINS = 6

/** Catalog users can pin onto Home. Order is the picker default. */
export const PINNABLE_DEFS: PinDef[] = [
  {
    id: 'kabine',
    to: '/kabine',
    labelKey: 'look.nav',
    emoji: '🪞',
    hide: () => !isFlagOn('kabine'),
  },
  { id: 'parkmerke', to: '/parkmerke', labelKey: 'pin.parkmerke', emoji: '🅿️' },
  { id: 'social', to: '/social', labelKey: 'nav.social', emoji: '✨' },
  {
    id: 'jobs',
    to: '/jobs',
    labelKey: 'tile.jobs',
    emoji: '🧰',
    hide: (c) => c.kids && !kidsMaySeeJobs(),
  },
  { id: 'match', to: '/match', labelKey: 'nav.match', emoji: '🎯' },
  {
    id: 'abflug',
    to: '/abflug',
    labelKey: 'travel.nav',
    emoji: '✈️',
    hide: (c) => c.hideTravel,
  },
  { id: 'dashboard', to: '/dashboard', labelKey: 'mein.dashboard', emoji: '📊', hide: (c) => c.kids },
]

function loadIds(): PinId[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const allowed = new Set(PINNABLE_DEFS.map((d) => d.id))
    const out: PinId[] = []
    for (const item of parsed) {
      if (typeof item === 'string' && allowed.has(item as PinId) && !out.includes(item as PinId)) {
        out.push(item as PinId)
      }
      if (out.length >= MAX_PINS) break
    }
    return out
  } catch {
    return []
  }
}

let cache: PinId[] | null = null

function getIds(): PinId[] {
  if (!cache) cache = loadIds()
  return cache
}

function commit(next: PinId[]) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribePins(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getPinnedIds(): PinId[] {
  return [...getIds()]
}

export function isPinned(id: PinId): boolean {
  return getIds().includes(id)
}

export function togglePin(id: PinId): PinId[] {
  const cur = getIds()
  if (cur.includes(id)) {
    const next = cur.filter((x) => x !== id)
    commit(next)
    return next
  }
  if (cur.length >= MAX_PINS) return cur
  const next = [...cur, id]
  commit(next)
  return next
}

export function setPinnedIds(ids: PinId[]): PinId[] {
  const allowed = new Set(PINNABLE_DEFS.map((d) => d.id))
  const next: PinId[] = []
  for (const id of ids) {
    if (allowed.has(id) && !next.includes(id)) next.push(id)
    if (next.length >= MAX_PINS) break
  }
  commit(next)
  return next
}

export function visiblePinDefs(ctx: HubCtx = hubCtx()): PinDef[] {
  return PINNABLE_DEFS.filter((d) => !d.hide?.(ctx))
}

export type ResolvedPin = {
  id: PinId
  to: string
  label: string
  emoji: string
}

/** Pinned shortcuts in user order, filtered for kids/flags. */
export function resolvePinnedShortcuts(
  t: (key: string) => string,
  ctx: HubCtx = hubCtx(),
  ids: PinId[] = getPinnedIds(),
): ResolvedPin[] {
  const byId = new Map(visiblePinDefs(ctx).map((d) => [d.id, d]))
  const out: ResolvedPin[] = []
  for (const id of ids) {
    const def = byId.get(id)
    if (!def) continue
    out.push({ id: def.id, to: def.to, label: t(def.labelKey), emoji: def.emoji })
  }
  return out
}

/** Test helper — clears in-memory + storage. */
export function __resetPinsForTests() {
  cache = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
