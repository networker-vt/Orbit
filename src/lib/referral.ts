import { uid } from './utils'

const KEY = 'el_referral_v1'
const EVT = 'el-referral-changed'

export interface ReferralState {
  code: string
  capturedRef: string | null
  referredBy: string | null
  featuredCredits: number
  signups: { at: string; ref: string; userId?: string }[]
}

function defaultState(): ReferralState {
  return {
    code: makeCode(),
    capturedRef: null,
    referredBy: null,
    featuredCredits: 0,
    signups: [],
  }
}

function makeCode() {
  const raw = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `OR-${raw}`
}

function load(): ReferralState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as ReferralState
    if (!parsed.code) return defaultState()
    return parsed
  } catch {
    return defaultState()
  }
}

let cache: ReferralState | null = null

function get(): ReferralState {
  if (!cache) cache = load()
  return cache
}

function commit(next: ReferralState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeReferral(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getReferral(): ReferralState {
  return structuredClone(get())
}

export function shareUrl() {
  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.trim()
  if (configured) {
    const root = configured.endsWith('/') ? configured : `${configured}/`
    return `${root}?ref=${encodeURIComponent(get().code)}`
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = import.meta.env.BASE_URL || '/orbit/'
  const path = base.startsWith('/') ? base : `/${base}`
  return `${origin}${path}?ref=${encodeURIComponent(get().code)}`
}

export function captureRefFromSearch(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const ref = (params.get('ref') || '').trim().toUpperCase()
  if (!ref) return
  const next = structuredClone(get())
  if (ref === next.code) return
  next.capturedRef = ref
  commit(next)
}

export function consumePendingReferral(userId?: string) {
  const next = structuredClone(get())
  if (!next.capturedRef || next.referredBy) return next
  next.referredBy = next.capturedRef
  next.signups.unshift({
    at: new Date().toISOString(),
    ref: next.capturedRef,
    userId,
  })
  commit(next)
  return next
}

/** Demo: simulate a successful friend signup via own code. */
export function simulateReferralSignup() {
  const next = structuredClone(get())
  next.signups.unshift({
    at: new Date().toISOString(),
    ref: next.code,
    userId: uid('ref'),
  })
  commit(next)
  return next
}

export function spendFeaturedCredits(amount: number) {
  const next = structuredClone(get())
  next.featuredCredits = Math.max(0, next.featuredCredits - Math.max(0, amount))
  commit(next)
  return next
}

export const REFERRAL_RULES_DE = [
  'Jeder Account erhält einen persönlichen Code (lokal auf diesem Gerät).',
  'Link teilen: ?ref=CODE — der Code wird beim ersten Besuch gespeichert.',
  'Bei Registrierung oder Demo-Login wird der Code dem neuen Account zugeordnet.',
  'Referrer (Demo): +40 Allda Credits pro geworbenem Signup — aus dem Rewards-Pool innerhalb der 21M.',
  'Geworbene Person: Willkommens-Credits beim Signup (Welcome-Pool) — getrennt vom Referral-Bonus.',
  'Credits sind Allda Credits für Boosts (Match, Listing, Pins, Social, Allda+, Chat) — kein Auszahlungsanspruch.',
  'Jede Gutschrift und jeder Spend erzeugt einen Ledger-Beleg (txn_id) auf diesem Gerät.',
  'Eigenen Code auf dem eigenen Gerät zu nutzen, bringt keine Extra-Credits.',
  'Programm ist ein Produkt-Stub bis echte Accounts, Anti-Fraud und Auszahlung existieren.',
]
