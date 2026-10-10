import { uid } from './utils'

const KEY = 'orbit_improvements_v1'
const EVT = 'orbit-improvements-changed'

export const ORBIT_GITHUB_REPO = 'https://github.com/networker-vt/eventlogistik-event-os'
export const ORBIT_CONTRIBUTING = `${ORBIT_GITHUB_REPO}/blob/main/CONTRIBUTING.md`

export interface ImprovementIdea {
  id: string
  text: string
  rating: number
  createdAt: string
  source: 'registration' | 'mitentwickeln' | 'other'
}

function load(): ImprovementIdea[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ImprovementIdea[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let cache: ImprovementIdea[] | null = null

function get() {
  if (!cache) cache = load()
  return cache
}

function commit(next: ImprovementIdea[]) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeImprovements(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function listImprovements(): ImprovementIdea[] {
  return structuredClone(get()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addImprovement(text: string, rating = 0, source: ImprovementIdea['source'] = 'mitentwickeln') {
  const t = text.trim()
  if (!t) return listImprovements()
  const row: ImprovementIdea = {
    id: uid('idea'),
    text: t,
    rating: Math.min(5, Math.max(0, Math.round(rating))),
    createdAt: new Date().toISOString(),
    source,
  }
  commit([row, ...get()])
  return listImprovements()
}

export function removeImprovement(id: string) {
  commit(get().filter((x) => x.id !== id))
  return listImprovements()
}

export function exportImprovementsJson(): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), ideas: listImprovements() }, null, 2)
}

export function __resetImprovementsForTests() {
  cache = null
  localStorage.removeItem(KEY)
}
