/**
 * Allda+ profile / accent themes — cosmetic unlocks via Credits (no cash-out).
 * Applies `data-orbit-plus` on <html> for CSS accent overrides.
 */
const KEY = 'orbit_orbit_plus_v1'
const EVT = 'orbit-plus-changed'

export type OrbitPlusThemeId = 'aurora' | 'copper' | 'neon'

export type OrbitPlusState = {
  unlocked: OrbitPlusThemeId[]
  active: OrbitPlusThemeId | null
}

export const ORBIT_PLUS_THEMES: {
  id: OrbitPlusThemeId
  labelDe: string
  labelEn: string
  emoji: string
}[] = [
  { id: 'aurora', labelDe: 'Aurora', labelEn: 'Aurora', emoji: '🌌' },
  { id: 'copper', labelDe: 'Kupfer', labelEn: 'Copper', emoji: '🟤' },
  { id: 'neon', labelDe: 'Neon', labelEn: 'Neon', emoji: '💜' },
]

function defaultState(): OrbitPlusState {
  return { unlocked: [], active: null }
}

function load(): OrbitPlusState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<OrbitPlusState>
    const unlocked = Array.isArray(parsed.unlocked)
      ? parsed.unlocked.filter((id): id is OrbitPlusThemeId =>
          ORBIT_PLUS_THEMES.some((t) => t.id === id),
        )
      : []
    const active =
      parsed.active && unlocked.includes(parsed.active as OrbitPlusThemeId)
        ? (parsed.active as OrbitPlusThemeId)
        : unlocked[0] ?? null
    return { unlocked, active }
  } catch {
    return defaultState()
  }
}

let cache: OrbitPlusState | null = null

function get(): OrbitPlusState {
  if (!cache) cache = load()
  return cache
}

function applyDom(active: OrbitPlusThemeId | null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (active) root.setAttribute('data-orbit-plus', active)
  else root.removeAttribute('data-orbit-plus')
}

function commit(next: OrbitPlusState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  applyDom(next.active)
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeOrbitPlus(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function initOrbitPlusDom() {
  applyDom(get().active)
}

export function getOrbitPlus(): OrbitPlusState {
  return structuredClone(get())
}

export function isThemeUnlocked(id: OrbitPlusThemeId): boolean {
  return get().unlocked.includes(id)
}

export function unlockOrbitPlusTheme(id: OrbitPlusThemeId): OrbitPlusState {
  const next = structuredClone(get())
  if (!next.unlocked.includes(id)) next.unlocked.push(id)
  if (!next.active) next.active = id
  commit(next)
  return structuredClone(next)
}

export function setActiveOrbitPlusTheme(id: OrbitPlusThemeId | null): OrbitPlusState {
  const next = structuredClone(get())
  if (id && !next.unlocked.includes(id)) return structuredClone(next)
  next.active = id
  commit(next)
  return structuredClone(next)
}

export function resetOrbitPlusForTests() {
  cache = null
  localStorage.removeItem(KEY)
  applyDom(null)
}
