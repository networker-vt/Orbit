/**
 * Allda Kids — age bands, kids mode, parental PIN, content filter.
 * Kids mode is on for every band under 18. 18+ is adult. Unset age is adult (no lock-in).
 * Super veto: parental PIN/gate first, then kid UI. 0 Credits (no mint/spend/P2P). Hide Wallet.
 */
export type AgeBand = 'under13' | '13-15' | '16-17' | '18+'

export type ParentalReason = 'leave_kids' | 'credits_spend' | 'external_social'

export interface KidsState {
  ageBand: AgeBand | null
  /** Explicit kids mode; derived from age unless an adult session unlocked leave. */
  kidsMode: boolean
  /** FNV-1a hash of the parental PIN — never store the PIN in plaintext. */
  pinHash?: string
  parentalVerifiedUntil?: string
}

const KEY = 'orbit_kids_v1'
const EVT = 'orbit-kids-changed'
const GATE_EVT = 'orbit-parental-gate'
const SESSION_MS = 15 * 60 * 1000
const PIN_SALT = 'orbit-kids-pin-v1:'

export const AGE_BANDS: AgeBand[] = ['under13', '13-15', '16-17', '18+']

export const AGE_BAND_COPY: Record<AgeBand, { de: string; en: string; hintDe: string; hintEn: string }> = {
  under13: {
    de: 'unter 13',
    en: 'under 13',
    hintDe: 'Campus + Assist. Keine Jobs, keine Buchung, 0 Credits.',
    hintEn: 'Campus + Assist. No jobs, no booking, 0 credits.',
  },
  '13-15': {
    de: '13–15',
    en: '13–15',
    hintDe: 'Lernen + altersgerechte Minijob-Stubs. Wallet aus.',
    hintEn: 'Learning + age-safe minijob stubs. Wallet hidden.',
  },
  '16-17': {
    de: '16–17',
    en: '16–17',
    hintDe: 'Mehr Minijobs, weiter ohne Adult-Chat/Reise/Kabine-Try-on/Credits.',
    hintEn: 'More minijobs, still no adult chat/travel/Kabine try-on/credits.',
  },
  '18+': {
    de: '18+',
    en: '18+',
    hintDe: 'Voller Allda. Eltern-PIN beim Verlassen von Kids.',
    hintEn: 'Full Allda. Parental PIN when leaving Kids.',
  },
}

function defaultState(): KidsState {
  return { ageBand: null, kidsMode: false }
}

function load(): KidsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<KidsState>
    const ageBand = AGE_BANDS.includes(parsed.ageBand as AgeBand) ? (parsed.ageBand as AgeBand) : null
    const kidsMode = ageBand ? isUnder18(ageBand) : Boolean(parsed.kidsMode)
    return {
      ageBand,
      kidsMode,
      pinHash: typeof parsed.pinHash === 'string' ? parsed.pinHash : undefined,
      parentalVerifiedUntil: parsed.parentalVerifiedUntil,
    }
  } catch {
    return defaultState()
  }
}

let cache: KidsState | null = null

function get(): KidsState {
  if (!cache) cache = load()
  return cache
}

function commit(next: KidsState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeKids(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getKids(): KidsState {
  return { ...get() }
}

export function isUnder18(band: AgeBand | null | undefined) {
  return band === 'under13' || band === '13-15' || band === '16-17'
}

export function isKidsMode() {
  const s = get()
  if (s.ageBand) return isUnder18(s.ageBand)
  return s.kidsMode
}

export function kidsAgeBand(): AgeBand | null {
  return get().ageBand
}

export function isValidPinFormat(pin: string) {
  return /^\d{4}$/.test(String(pin).trim())
}

/** Demo hash — not a KDF. PIN never stored in plaintext. */
export function hashPin(pin: string) {
  const s = `${PIN_SALT}${String(pin).trim()}`
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

export function hasParentalPin() {
  return Boolean(get().pinHash)
}

export function setParentalPin(pin: string): boolean {
  if (!isValidPinFormat(pin)) return false
  commit({ ...get(), pinHash: hashPin(pin) })
  return true
}

export function verifyPin(pin: string): boolean {
  const hash = get().pinHash
  if (!hash || !isValidPinFormat(pin)) return false
  if (hashPin(pin) !== hash) return false
  unlockParentalSession()
  return true
}

/** Parent configures PIN + age band, then kid UI may appear. Fail-closed. */
export function enableKids(band: AgeBand, pin: string): KidsState | null {
  if (!isUnder18(band)) return null
  if (!isValidPinFormat(pin)) return null
  const next: KidsState = {
    ...get(),
    ageBand: band,
    kidsMode: true,
    pinHash: hashPin(pin),
  }
  commit(next)
  return next
}

export function hasParentalSession(now = Date.now()) {
  const until = get().parentalVerifiedUntil
  if (!until) return false
  return Date.parse(until) > now
}

export function unlockParentalSession(now = Date.now()) {
  const next = { ...get(), parentalVerifiedUntil: new Date(now + SESSION_MS).toISOString() }
  commit(next)
  return next
}

export function setAgeBand(band: AgeBand) {
  const next: KidsState = {
    ...get(),
    ageBand: band,
    kidsMode: isUnder18(band),
  }
  commit(next)
  return next
}

/** Leave kids mode only after a valid parental session (PIN). Fail-closed. */
export function leaveKidsMode(): boolean {
  if (!hasParentalSession()) return false
  const next: KidsState = {
    ...get(),
    ageBand: '18+',
    kidsMode: false,
  }
  commit(next)
  return true
}

export function enterKidsMode(band: AgeBand = 'under13') {
  if (band === '18+') return getKids()
  return setAgeBand(band)
}

export type ParentalChallenge = {
  a: number
  b: number
  op: '+' | '−'
  answer: number
  promptDe: string
  promptEn: string
}

/** Kept for tests / fallback copy. Product gate is PIN. */
export function makeParentalChallenge(seed = Date.now()): ParentalChallenge {
  const n = Math.abs(seed) || 1
  const a = 11 + (n % 17)
  const b = 7 + ((n * 3) % 13)
  const plus = n % 2 === 0
  const answer = plus ? a + b : a - b
  const op: '+' | '−' = plus ? '+' : '−'
  return {
    a,
    b,
    op,
    answer,
    promptDe: `Eltern-Check: Was ist ${a} ${op} ${b}?`,
    promptEn: `Parent check: What is ${a} ${op} ${b}?`,
  }
}

export function checkParentalAnswer(challenge: ParentalChallenge, raw: string) {
  const n = Number(String(raw).trim().replace(',', '.'))
  return Number.isFinite(n) && n === challenge.answer
}

export function needsParentalGate(reason: ParentalReason) {
  if (!isKidsMode()) return false
  if (hasParentalSession()) return false
  return reason === 'leave_kids' || reason === 'credits_spend' || reason === 'external_social'
}

export function emitParentalRequired(reason: ParentalReason) {
  window.dispatchEvent(new CustomEvent(GATE_EVT, { detail: { reason } }))
}

export function subscribeParentalGate(cb: (reason: ParentalReason) => void) {
  const h = (e: Event) => {
    const reason = (e as CustomEvent<{ reason?: ParentalReason }>).detail?.reason
    if (reason) cb(reason)
  }
  window.addEventListener(GATE_EVT, h)
  return () => window.removeEventListener(GATE_EVT, h)
}

export function listingIsSafeForKids(listing: {
  safeForKids?: boolean
  marketType?: string
  tags?: string[]
  jobType?: string
  title?: string
  description?: string
}) {
  if (listing.safeForKids === true) return true
  if (listing.safeForKids === false) return false
  const hay = `${listing.title || ''} ${listing.description || ''} ${(listing.tags || []).join(' ')} ${listing.jobType || ''}`.toLowerCase()
  if (/(bar|nacht|club|alkohol|adult|18\+|casino|wett)/i.test(hay)) return false
  return listing.marketType === 'minijob' && /(nachhilfe|zeitung|haustier|garten|babysitt|café|cafe|campus)/i.test(hay)
}

export function kidsMaySeeJobs(band: AgeBand | null = kidsAgeBand()) {
  return band === '13-15' || band === '16-17'
}

export function kidsHideTravel() {
  return isKidsMode()
}

export function kidsHideSocialChat() {
  return isKidsMode()
}

export function kidsHideAdultTryOn() {
  return isKidsMode()
}

export function kidsHideSoftPaywall() {
  return isKidsMode()
}

/** Super veto: kids never mint, spend, or P2P. Wallet is hidden. */
export function kidsCreditsFrozen() {
  return isKidsMode()
}

export function kidsHideWallet() {
  return isKidsMode()
}

export function kidsHidePublicChat() {
  return isKidsMode()
}

/** Super veto 2.8.1: kids never connect social channels (Meta / X / Instagram). */
export function kidsHideSocialConnects() {
  return isKidsMode()
}

export function __resetKidsForTests() {
  cache = null
  localStorage.removeItem(KEY)
}
