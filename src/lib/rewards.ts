/**
 * Allda Credits rewards — fair, once-per-action, from the pre-allocated rewards pool.
 * Welcome / early-tester grants debit their own pools inside the 21M cap.
 *
 * Super veto — Contributor-Rewards:
 * ONLY from the Rewards-Pool after a **merged** PR.
 * Anti-farm: 1 grant / PR (`contributor:pr:{n}`).
 * Server-ordinal / fail-closed. NEVER client-mint. NEVER in the Home flow.
 */
import {
  earnCredits,
  getCredits,
  grantContributorMergedPrFromServer,
  grantWelcomeAllocation,
  contributorProofMatches,
  type ContributorMergedPrProof,
} from './credits'
import { isFlagOn } from './flags'
import { kidsCreditsFrozen } from './kids'
import { getPrefs } from './prefs'

const KEY = 'orbit_rewards_flags_v1'
const EVT = 'orbit-rewards-changed'

export interface RewardFlags {
  welcome: boolean
  signup: boolean
  prefs: boolean
  profileComplete: boolean
  successfulMatch: boolean
  ideas: number
  reviews: number
  searchDays: string[]
  completedJobs: string[]
  /** Merged PR numbers already granted (anti-farm). */
  grantedPrs: number[]
}

/** Contributor table — merged PRs only. Casual ideas stay a separate small reward. */
export const CONTRIBUTOR_REWARDS = [
  { id: 'pr', amount: 120, cap: 1, de: 'Merged PR (1 Grant / PR)', en: 'Merged PR (1 grant / PR)' },
] as const

function defaultFlags(): RewardFlags {
  return {
    welcome: false,
    signup: false,
    prefs: false,
    profileComplete: false,
    successfulMatch: false,
    ideas: 0,
    reviews: 0,
    searchDays: [],
    completedJobs: [],
    grantedPrs: [],
  }
}

function load(): RewardFlags {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultFlags()
    const parsed = JSON.parse(raw) as Partial<RewardFlags> & { contribute?: number; prClaims?: number }
    const next = { ...defaultFlags(), ...parsed }
    if (!Array.isArray(next.grantedPrs)) next.grantedPrs = []
    return next
  } catch {
    return defaultFlags()
  }
}

let cache: RewardFlags | null = null
function get(): RewardFlags {
  if (!cache) cache = load()
  return cache
}
function commit(next: RewardFlags) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeRewards(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getRewardFlags(): RewardFlags {
  return structuredClone(get())
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function alreadyWelcomed(): boolean {
  return getCredits().txs.some((t) => t.type === 'welcome' || /early tester|willkommen/i.test(t.label))
}

/** Call once on app boot. Grants early-tester or later welcome from the 21M reserve. */
export async function initRewards() {
  if (!isFlagOn('credits')) return get()
  const flags = structuredClone(get())
  if (flags.welcome || alreadyWelcomed()) {
    flags.welcome = true
    commit(flags)
    return flags
  }
  const granted = await grantWelcomeAllocation()
  if (granted) {
    flags.welcome = true
    commit(flags)
  }
  return flags
}

export async function grantWelcomeOnSignup() {
  if (!isFlagOn('credits')) return
  const flags = structuredClone(get())
  if (flags.signup) return
  flags.signup = true
  if (!flags.welcome && !alreadyWelcomed()) {
    const granted = await grantWelcomeAllocation()
    if (granted) flags.welcome = true
  }
  commit(flags)
}

export async function maybeGrantPrefsComplete() {
  if (!isFlagOn('credits') || kidsCreditsFrozen()) return
  const flags = structuredClone(get())
  if (flags.prefs) return
  if (!getPrefs().completed) return
  if (!(await earnCredits(20, 'Prefs vollständig (Demo) — Rewards-Pool'))) return
  flags.prefs = true
  commit(flags)
}

export async function maybeGrantProfileComplete() {
  if (!isFlagOn('credits') || kidsCreditsFrozen()) return
  const flags = structuredClone(get())
  if (flags.profileComplete) return
  try {
    const raw = localStorage.getItem('orbit_profile_hub_v1')
    const hub = raw ? (JSON.parse(raw) as { skills?: unknown[]; docs?: unknown[] }) : {}
    const prefs = getPrefs()
    const ok =
      prefs.completed &&
      (hub.skills?.length ?? 0) >= 3 &&
      (hub.docs?.length ?? 0) >= 1 &&
      prefs.seeker.radiusKm > 0
    if (!ok) return
    if (!(await earnCredits(30, 'Profil weitgehend vollständig (Demo) — Rewards-Pool'))) return
    flags.profileComplete = true
    commit(flags)
  } catch {
    /* ignore */
  }
}

export async function grantSuccessfulMatch() {
  if (!isFlagOn('credits') || kidsCreditsFrozen()) return null
  const flags = structuredClone(get())
  if (flags.successfulMatch) return null
  const next = await earnCredits(15, 'Erfolgreiches Match (Demo) — Rewards-Pool')
  if (!next) return null
  flags.successfulMatch = true
  commit(flags)
  return next
}

export async function grantIdeaReward() {
  if (!isFlagOn('credits') || kidsCreditsFrozen()) return null
  const flags = structuredClone(get())
  if (flags.ideas >= 3) return null
  const next = await earnCredits(8, `Feedback / Ideen-Box (${flags.ideas + 1}/3, Demo) — Rewards-Pool`)
  if (!next) return null
  flags.ideas += 1
  commit(flags)
  return next
}

export type { ContributorMergedPrProof }

/**
 * Contributor-Reward after a merged PR. Server/CI only — never Home, never a pasted URL.
 * `proof.merged` must be true and `proof.serverOrdinal` must be a positive int equal to `prNumber`.
 * Anti-farm: 1 grant per PR number (`contributor:pr:{n}`).
 */
export async function grantContributorMergedPr(prNumber: number, proof: ContributorMergedPrProof) {
  if (!isFlagOn('credits') || kidsCreditsFrozen()) return null
  if (!contributorProofMatches(prNumber, proof)) return null
  const n = proof.serverOrdinal
  const flags = structuredClone(get())
  if (flags.grantedPrs.includes(n)) return null
  const next = await grantContributorMergedPrFromServer(n, proof)
  if (!next) return null
  flags.grantedPrs = [...flags.grantedPrs, n]
  commit(flags)
  return next
}

export function isVerbesserer(flags = get()) {
  return flags.grantedPrs.length > 0
}

export function __resetRewardsForTests() {
  cache = null
  localStorage.removeItem(KEY)
}

export async function grantReviewReward() {
  if (!isFlagOn('credits') || kidsCreditsFrozen()) return null
  const flags = structuredClone(get())
  if (flags.reviews >= 5) return null
  const next = await earnCredits(10, `Erfahrungs-Review (${flags.reviews + 1}/5, Demo) — Rewards-Pool`)
  if (!next) return null
  flags.reviews += 1
  commit(flags)
  return next
}

/** Small daily bonus for actually searching / swiping — capped, not spammy. */
export async function grantSearchActivity() {
  if (!isFlagOn('credits') || kidsCreditsFrozen()) return null
  const flags = structuredClone(get())
  const day = todayKey()
  if (flags.searchDays.includes(day)) return null
  if (flags.searchDays.length >= 7) return null
  const next = await earnCredits(5, 'Aktive Suche / Match (Tagesbonus, Demo) — Rewards-Pool')
  if (!next) return null
  flags.searchDays = [...flags.searchDays, day].slice(-14)
  commit(flags)
  return next
}

export async function grantJobCompleted(bookingId: string) {
  if (!isFlagOn('credits') || kidsCreditsFrozen()) return null
  const flags = structuredClone(get())
  if (flags.completedJobs.includes(bookingId)) return null
  if (flags.completedJobs.length >= 5) return null
  const next = await earnCredits(25, 'Job abgeschlossen (Demo) — Rewards-Pool')
  if (!next) return null
  flags.completedJobs.push(bookingId)
  commit(flags)
  return next
}

export const REWARD_RULES_DE = [
  'Early Testers (Signup 1–50): 2.000 Credits aus dem Early-Pool plus −20 % Boost für immer. Danach 200 Welcome (17.000 Plätze) — beides aus der 21M-Reserve, kein Extra-Mint.',
  'Prefs + Profil (Skills, Radius, mind. 1 Nachweis): einmalige Boni aus dem Rewards-Pool.',
  'Erstes erfolgreiches Match: 15 Credits, einmalig.',
  'Empfehlen: 40 Credits pro Demo-Signup aus dem Rewards-Pool — nicht fürs Leerspammen.',
  'Ideen-Box und Reviews: kleine Credits, gedeckelt (3 / 5). Kein Contributor-Grant.',
  'Contributor-Rewards: NUR nach einem **gemergten** PR, 1 Grant pro PR, Op `contributor:pr:{n}`, Pflichtfeld `serverOrdinal === prNumber`, fail-closed aus dem Rewards-Pool. Nie Client-Mint, nie URL-Claim, nie im Home-Flow. Kids: 0 Credits.',
  'Suche/Match: 5 Credits pro Tag, max. 7 Tage.',
  'Job abschließen: 25 Credits, max. 5.',
  'Ist der Rewards-Pool leer, schlagen Grants fehl. Packs leer → nur noch P2P. Alles Demo-Ledger; echte 21M-Enforcement braucht später Server/Chain.',
]

export const REWARD_RULES_EN = [
  'Early testers (signups 1–50): 2,000 credits from the early pool plus −20% boost forever. Later 200 welcome (17,000 seats) — both from the 21M reserve, no extra mint.',
  'Prefs + profile (skills, radius, at least 1 proof): one-time bonuses from the rewards pool.',
  'First successful match: 15 credits, once.',
  'Referrals: 40 credits per demo signup from the rewards pool — not for spam.',
  'Ideas box and reviews: small credits, capped (3 / 5). Not a contributor grant.',
  'Contributor rewards: ONLY after a **merged** PR, 1 grant per PR, op `contributor:pr:{n}`, required `serverOrdinal === prNumber`, fail-closed from the rewards pool. Never client-mint, never URL-claim, never in the Home flow. Kids: 0 credits.',
  'Search/match: 5 credits per day, max 7 days.',
  'Job completed: 25 credits, max 5.',
  'If the rewards pool is empty, grants fail. Packs empty → P2P only. Demo ledger; real 21M enforcement needs server/chain later.',
]
