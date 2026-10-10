/**
 * Orbit Credits — user wallet on top of the 21M protocol (demo ledger).
 * Core discovery stays free. Credits buy boosts only.
 * All grants debit a pre-allocated pool or fail — never mint above MAX_SUPPLY.
 */
import {
  EARLY_TESTER_GRANT,
  P2P_ORDERS,
  WELCOME_GRANT,
  ensureSignupIdentity,
  getSignupIdentity,
  holdFromUser,
  isPackMarketP2P,
  getProtocol,
  mintFromPool,
  packsRemain,
  peerTransferOut,
  restoreProtocolSnapshot,
  simulatePacksSoldOut as protocolSimulatePacksSoldOut,
  snapshotProtocol,
  takeFromP2P,
  welcomeGrantFor,
  type CreditPoolId,
} from './creditProtocol'
import { __setAppModeForTests, isFlagOn, isProdMode } from './flags'
import { kidsCreditsFrozen } from './kids'
import { getReferral, spendFeaturedCredits, simulateReferralSignup } from './referral'
import { getWallet, mockAdjustBalance } from './wallet'
import { uid } from './utils'
import {
  applyHydratedEvents,
  hydrateLedgerFromSupabase,
  ledgerBalance,
  listLedgerEvents,
  reconstructFromSignedTxs,
  submitCreditIntent,
  type LedgerEvent,
  __resetLedgerForTests,
} from './creditLedger'

export {
  MAX_SUPPLY,
  EARLY_TESTER_CAP,
  EARLY_TESTER_GRANT,
  WELCOME_GRANT,
  WELCOME_SEATS,
  SPONSOR_FEE,
  ALLOCATION_TABLE,
  P2P_ORDERS,
  POOL_ALLOCATION,
  formatSupplyLine,
  getProtocol,
  getSignupIdentity,
  ensureSignupIdentity,
  isPackMarketP2P,
  remainingReserve,
  supplyMeterPct,
  wertIndex,
  P2P_TAKE_RATE,
  type ProtocolState,
  type SignupIdentity,
  type P2POrder,
} from './creditProtocol'

const KEY = 'orbit_credits_v2'
const EVT = 'orbit-credits-changed'

/** Indicative: 10 Credits ≈ 1 EUR (demo only). */
export const CREDITS_PER_EUR = 10

export const FREE_SWIPES_PER_DAY = 20
export const EXTRA_SWIPES_PACK = 20
/** Early testers keep this discount on boost prices forever (demo + prod intents). */
export const EARLY_BOOST_DISCOUNT = 0.2

export type CreditPackId = 'small' | 'medium' | 'large'

export type CreditSpendKind =
  | 'featured'
  | 'extra_swipes'
  | 'travel_scan'
  | 'social_boost'
  | 'interview_slot'
  | 'booking'
  | 'unlock_message'
  | 'demo_gig'
  | 'sponsor_fee'
  | 'look_tryon'
  | 'look_shop'
  | 'assist_priority'

export type CreditTxType = 'earn' | 'spend' | 'exchange_in' | 'exchange_out' | 'purchase' | 'gift' | 'p2p' | 'welcome'

export interface CreditTx {
  id: string
  type: CreditTxType
  amount: number
  label: string
  kind?: CreditSpendKind
  createdAt: string
}

export interface CreditsState {
  balance: number
  txs: CreditTx[]
  swipeDay: string
  swipesUsed: number
  extraSwipes: number
  travelScanDay?: string
  lookTryOnDay?: string
  assistDay?: string
  assistUsed?: number
  boostMonth?: string
  freeBoostUsed?: boolean
  meaningfulAt?: string
}

export interface CreditPack {
  id: CreditPackId
  credits: number
  priceEur: number
  priceLabel: string
  labelDe: string
  labelEn: string
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'small', credits: 100, priceEur: 9.9, priceLabel: '9,90 €', labelDe: 'Klein', labelEn: 'Small' },
  { id: 'medium', credits: 300, priceEur: 24.9, priceLabel: '24,90 €', labelDe: 'Mittel', labelEn: 'Medium' },
  { id: 'large', credits: 800, priceEur: 59.9, priceLabel: '59,90 €', labelDe: 'Groß', labelEn: 'Large' },
]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function defaultState(): CreditsState {
  return {
    balance: 0,
    txs: [],
    swipeDay: todayKey(),
    swipesUsed: 0,
    extraSwipes: 0,
  }
}

function normalize(raw: Partial<CreditsState> & { balance: number; txs: CreditTx[] }): CreditsState {
  const day = todayKey()
  const swipeDay = raw.swipeDay || day
  const rolled = swipeDay !== day
  return {
    balance: Math.max(0, raw.balance),
    txs: Array.isArray(raw.txs) ? raw.txs : [],
    swipeDay: rolled ? day : swipeDay,
    swipesUsed: rolled ? 0 : Math.max(0, raw.swipesUsed ?? 0),
    extraSwipes: rolled ? 0 : Math.max(0, raw.extraSwipes ?? 0),
    travelScanDay: raw.travelScanDay,
    lookTryOnDay: raw.lookTryOnDay,
    assistDay: raw.assistDay,
    assistUsed: raw.assistDay === day ? Math.max(0, raw.assistUsed ?? 0) : 0,
    boostMonth: raw.boostMonth,
    freeBoostUsed: raw.boostMonth === day.slice(0, 7) ? Boolean(raw.freeBoostUsed) : false,
    meaningfulAt: raw.meaningfulAt,
  }
}

const SPEND_KIND_SET = new Set<CreditSpendKind>([
  'featured',
  'extra_swipes',
  'travel_scan',
  'social_boost',
  'interview_slot',
  'booking',
  'unlock_message',
  'demo_gig',
  'sponsor_fee',
  'look_tryon',
  'look_shop',
  'assist_priority',
])

function txTypeFromEvent(e: LedgerEvent): CreditTxType {
  if (e.kind === 'welcome') return 'welcome'
  if (e.kind === 'purchase') return 'purchase'
  if (e.kind === 'gift' || e.kind === 'sponsor_fee') return 'gift'
  if (e.kind === 'p2p') return 'p2p'
  if (e.kind === 'exchange_in') return 'exchange_in'
  if (e.kind === 'exchange_out') return 'exchange_out'
  if (e.delta < 0) return 'spend'
  return 'earn'
}

function eventToTx(e: LedgerEvent): CreditTx {
  const kind = SPEND_KIND_SET.has(e.kind as CreditSpendKind) ? (e.kind as CreditSpendKind) : undefined
  return {
    id: e.txn_id,
    type: txTypeFromEvent(e),
    amount: Math.abs(e.delta),
    label: e.label,
    kind,
    createdAt: e.created_at,
  }
}

/** R2: wallet cache tracks ledger sum. Prod always reads balance from events. */
export function syncCreditsWalletFromLedger() {
  const next = structuredClone(get())
  const events = listLedgerEvents()
  next.balance = Math.max(0, ledgerBalance())
  if (events.length) {
    next.txs = events.map(eventToTx)
  }
  commit(next)
  return next
}

function load(): CreditsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<CreditsState>
    if (typeof parsed.balance !== 'number') return defaultState()
    const state = normalize({ ...parsed, balance: parsed.balance, txs: parsed.txs ?? [] })
    if (!isProdMode()) {
      reconstructFromSignedTxs(state.txs)
    }
    if (listLedgerEvents().length) {
      state.balance = Math.max(0, ledgerBalance())
    }
    return state
  } catch {
    return defaultState()
  }
}

let cache: CreditsState | null = null
function get(): CreditsState {
  if (!cache) cache = load()
  const day = todayKey()
  if (cache.swipeDay !== day) {
    cache = {
      ...cache,
      swipeDay: day,
      swipesUsed: 0,
      extraSwipes: 0,
    }
    localStorage.setItem(KEY, JSON.stringify(cache))
  }
  if (isProdMode()) {
    cache.balance = Math.max(0, ledgerBalance())
  }
  return cache
}
function commit(next: CreditsState) {
  const seen = new Set<string>()
  next.txs = next.txs.filter((tx) => {
    if (seen.has(tx.id)) return false
    seen.add(tx.id)
    return true
  })
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeCredits(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getCredits(): CreditsState {
  return structuredClone(get())
}

/** Test helper — not used in UI. */
export function __resetCreditsForTests() {
  cache = null
  localStorage.removeItem(KEY)
  __resetLedgerForTests()
  __setAppModeForTests(null)
}

export async function hydrateCreditsLedger(userId?: string) {
  if (!userId) return null
  const bal = await hydrateLedgerFromSupabase(userId)
  if (bal == null) return null
  syncCreditsWalletFromLedger()
  return bal
}

/** Test/helper: replace ledger then sync wallet cache (R2). */
export function applyHydratedLedgerForTests(remote: LedgerEvent[], userId?: string) {
  applyHydratedEvents(remote, userId)
  return syncCreditsWalletFromLedger()
}

export function creditsLedgerSum(): number {
  return ledgerBalance()
}

export function creditsToEur(credits: number) {
  return credits / CREDITS_PER_EUR
}

export function eurToCredits(eur: number) {
  return Math.round(eur * CREDITS_PER_EUR)
}

/**
 * Local wallet credit only after a successful ledger intent.
 * Demo: submitCreditIntent appends locally first (optimistic).
 * Prod: submitCreditIntent hits RPC/Edge first; this function never commits
 * a balance bump unless the intent returns ok:true (R1).
 */
async function creditWallet(
  amount: number,
  type: CreditTxType,
  label: string,
  kind?: CreditSpendKind,
  opId?: string,
): Promise<CreditsState | null> {
  const next = structuredClone(get())
  const id = opId || uid('cr')
  if (next.txs.some((t) => t.id === id)) return next
  const amt = Math.max(0, Math.round(amount))
  const intent = await submitCreditIntent({
    txn_id: id,
    delta: amt,
    kind: kind || type,
    label,
    pool: type === 'welcome' ? undefined : type === 'purchase' ? 'packs' : type === 'p2p' ? 'p2p' : 'rewards',
  })
  if (!intent.ok) return null
  next.balance = Math.max(0, ledgerBalance())
  next.txs.unshift({
    id,
    type,
    amount: amt,
    label,
    kind,
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return next
}

/**
 * ATOMIC MINT (R3):
 * 1. Snapshot protocol (circulating + pools).
 * 2. Debit the pre-allocated pool (`mintFromPool`).
 * 3. Credit the user via ledger intent (`creditWallet` → `submitCreditIntent`).
 * 4. If the wallet/ledger write fails (prod RPC/cap/unconfigured, or demo kind reject),
 *    `restoreProtocolSnapshot` so circulating never moves without a user credit.
 *
 * Prod server: `apply_credit_intent` is one SQL transaction (supply row + credit_events).
 * The client protocol is a UX guardrail; the server ledger is the source of truth.
 */
function creditsClosed() {
  return !isFlagOn('credits')
}

export async function mintFromPoolToWallet(
  pool: CreditPoolId,
  amount: number,
  label: string,
  type: CreditTxType = 'earn',
): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  const amt = Math.max(0, Math.round(amount))
  if (amt === 0) return getCredits()
  const snap = snapshotProtocol()
  if (!mintFromPool(pool, amt)) return null
  const credited = await creditWallet(amt, type, label)
  if (!credited) {
    restoreProtocolSnapshot(snap)
    return null
  }
  return credited
}

/** Performance / contribution — always the pre-allocated rewards pool. */
export function earnCredits(amount: number, label: string): Promise<CreditsState | null> {
  return mintFromPoolToWallet('rewards', amount, label, 'earn')
}

export async function grantWelcomeAllocation(): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  const identity = ensureSignupIdentity()
  const grant = welcomeGrantFor(identity)
  const op = `welcome:${identity.ordinal}`
  // Already applied (protocol op or wallet tx) — never creditWallet without a new mint.
  if (get().txs.some((t) => t.id === op) || getProtocol().seenOpIds.includes(op)) {
    return getCredits()
  }
  const snap = snapshotProtocol()
  if (mintFromPool(grant.pool, grant.amount, op)) {
    const credited = await creditWallet(grant.amount, 'welcome', grant.label, undefined, op)
    if (credited) return credited
    restoreProtocolSnapshot(snap)
  }
  if (grant.pool === 'early') {
    return mintFromPoolToWallet(
      'welcome',
      WELCOME_GRANT,
      `Willkommen (Early-Pool leer) · Signup #${identity.ordinal} — ${WELCOME_GRANT} Credits`,
      'welcome',
    )
  }
  return null
}

/** Contributor grant: merged PR only, 1/PR, op `contributor:pr:{n}`, fail-closed. Never client-mint from a URL. */
export const CONTRIBUTOR_MERGED_PR_GRANT = 120

export type ContributorMergedPrProof = {
  merged: true
  /** GitHub PR number from Server/CI. Must equal `prNumber`. */
  serverOrdinal: number
}

export function contributorPrOpId(prNumber: number) {
  return `contributor:pr:${Math.trunc(prNumber)}`
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1
}

/** Fail-closed: merged + positive integer ordinal that equals the PR number. */
export function contributorProofMatches(
  prNumber: unknown,
  proof: unknown,
): proof is ContributorMergedPrProof {
  if (proof == null || typeof proof !== 'object') return false
  const p = proof as { merged?: unknown; serverOrdinal?: unknown }
  if (p.merged !== true) return false
  if (!isPositiveInt(p.serverOrdinal)) return false
  if (!isPositiveInt(prNumber)) return false
  return p.serverOrdinal === prNumber
}

/**
 * Private mint. Not exported — callers must go through `grantContributorMergedPrFromServer`.
 */
async function mintMergedPrFromRewardsPool(prNumber: number): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  const n = Math.trunc(prNumber)
  if (!isPositiveInt(n)) return null
  const op = contributorPrOpId(n)
  if (get().txs.some((t) => t.id === op) || getProtocol().seenOpIds.includes(op)) {
    return null
  }
  const snap = snapshotProtocol()
  if (!mintFromPool('rewards', CONTRIBUTOR_MERGED_PR_GRANT, op)) return null
  const credited = await creditWallet(
    CONTRIBUTOR_MERGED_PR_GRANT,
    'earn',
    `Contributor-Reward · merged PR #${n} — Rewards-Pool`,
    undefined,
    op,
  )
  if (!credited) {
    restoreProtocolSnapshot(snap)
    return null
  }
  return credited
}

/**
 * Server/CI path only. Requires `proof.serverOrdinal === prNumber` and `proof.merged === true`.
 * Naked `grantMergedPrFromRewardsPool` is not a public export.
 */
export async function grantContributorMergedPrFromServer(
  prNumber: number,
  proof: ContributorMergedPrProof,
): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  if (!contributorProofMatches(prNumber, proof)) return null
  return mintMergedPrFromRewardsPool(prNumber)
}

function applySpendSideEffects(next: CreditsState, kind: CreditSpendKind) {
  if (kind === 'extra_swipes') {
    next.extraSwipes += EXTRA_SWIPES_PACK
  }
  if (kind === 'travel_scan') {
    next.travelScanDay = todayKey()
  }
  if (kind === 'look_tryon') {
    next.lookTryOnDay = todayKey()
  }
}

export async function spendCredits(
  amount: number,
  kind: CreditSpendKind,
  label: string,
): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  const next = structuredClone(get())
  const amt = Math.max(0, Math.round(amount))
  if (next.balance < amt) return null
  const txn_id = uid('cr')
  const snap = snapshotProtocol()

  if (isProdMode()) {
    const intent = await submitCreditIntent({ txn_id, delta: -amt, kind, label })
    if (!intent.ok) return null
    if (!holdFromUser(amt)) {
      console.warn('[orbit] protocol hold failed after server spend — ledger is source of truth')
    }
  } else {
    if (!holdFromUser(amt)) return null
    const intent = await submitCreditIntent({ txn_id, delta: -amt, kind, label })
    if (!intent.ok) {
      restoreProtocolSnapshot(snap)
      return null
    }
  }

  next.balance = Math.max(0, ledgerBalance())
  next.txs.unshift({
    id: txn_id,
    type: 'spend',
    amount: amt,
    kind,
    label,
    createdAt: new Date().toISOString(),
  })
  if (!next.meaningfulAt) next.meaningfulAt = new Date().toISOString()
  applySpendSideEffects(next, kind)
  try {
    spendFeaturedCredits(Math.min(amt, getReferral().featuredCredits))
  } catch {
    /* ignore */
  }
  commit(next)
  return next
}

/** Gift / sponsoring: peer transfer, no mint. Tiny fee burned. */
export async function giftCredits(amount: number, toLabel = 'Orbit-Nutzer (Demo)'): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  const next = structuredClone(get())
  const amt = Math.max(0, Math.round(amount))
  if (amt <= 0 || next.balance < amt) return null
  const snap = snapshotProtocol()
  const moved = peerTransferOut(amt)
  if (!moved) return null
  const txn_id = uid('cr')
  const label = `Geschenk / Sponsoring an ${toLabel} · ${moved.net} an Peer, ${moved.burned} gebbrannt`
  const intent = await submitCreditIntent({ txn_id, delta: -amt, kind: 'gift', label })
  if (!intent.ok) {
    restoreProtocolSnapshot(snap)
    return null
  }
  next.balance = Math.max(0, ledgerBalance())
  next.txs.unshift({
    id: txn_id,
    type: 'gift',
    amount: amt,
    kind: 'sponsor_fee',
    label,
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return next
}

/** Mock exchange: Wallet EUR → Credits. Draws from the packs pool (system mint) or fails. */
export async function exchangeEurToCredits(eur: number): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  const wallet = getWallet()
  const amt = Math.max(0, eur)
  if (wallet.balanceEur < amt) return null
  const credits = eurToCredits(amt)
  if (credits <= 0) return getCredits()
  if (!packsRemain(credits) || isPackMarketP2P()) return null
  mockAdjustBalance('payout', amt, 'sepa')
  const minted = await mintFromPoolToWallet(
    'packs',
    credits,
    `Umtausch ${amt.toFixed(2)} € → ${credits} Credits (Demo, aus Pack-Reserve)`,
    'exchange_in',
  )
  if (!minted) {
    mockAdjustBalance('topup', amt, 'sepa')
    return null
  }
  return minted
}

export async function exchangeCreditsToEur(credits: number): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  const next = structuredClone(get())
  const amt = Math.max(0, Math.round(credits))
  if (next.balance < amt) return null
  const snap = snapshotProtocol()
  const eur = creditsToEur(amt)
  const txn_id = uid('cr')
  const label = `Umtausch ${amt} Credits → ${eur.toFixed(2)} € (Demo, indikativ)`

  if (isProdMode()) {
    const intent = await submitCreditIntent({ txn_id, delta: -amt, kind: 'exchange_out', label })
    if (!intent.ok) return null
    if (!holdFromUser(amt)) {
      console.warn('[orbit] protocol hold failed after server exchange — ledger is source of truth')
    }
  } else {
    if (!holdFromUser(amt)) return null
    const intent = await submitCreditIntent({ txn_id, delta: -amt, kind: 'exchange_out', label })
    if (!intent.ok) {
      restoreProtocolSnapshot(snap)
      return null
    }
  }

  mockAdjustBalance('topup', eur, 'sepa')
  next.balance = Math.max(0, ledgerBalance())
  next.txs.unshift({
    id: txn_id,
    type: 'exchange_out',
    amount: amt,
    label,
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return next
}

export async function claimReferralCreditsDemo() {
  if (creditsClosed()) return null
  if (!get().meaningfulAt) return null
  simulateReferralSignup()
  return earnCredits(40, 'Referral-Bonus (Demo) — nach erster sinnvoller Aktion, Rewards-Pool')
}

/** Demo checkout — credits appear only if the packs pool still has room. */
export function purchaseCreditPack(id: CreditPackId): Promise<CreditsState | null> {
  if (creditsClosed()) return Promise.resolve(null)
  if (kidsCreditsFrozen()) return Promise.resolve(null)
  const pack = CREDIT_PACKS.find((p) => p.id === id)
  if (!pack) return Promise.resolve(null)
  if (!packsRemain(pack.credits) || isPackMarketP2P()) return Promise.resolve(null)
  return mintFromPoolToWallet(
    'packs',
    pack.credits,
    `Pack ${pack.labelDe} · ${pack.credits} Credits · ${pack.priceLabel} (Demo-Checkout, aus Reserve, kein Stripe/PayPal)`,
    'purchase',
  )
}

export async function buyP2POrder(orderId: string): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (kidsCreditsFrozen()) return null
  const order = P2P_ORDERS.find((o) => o.id === orderId)
  if (!order) return null
  const snap = snapshotProtocol()
  if (!takeFromP2P(order.credits, order.id)) return null
  const credited = await creditWallet(
    order.credits,
    'p2p',
    `P2P von ${order.seller} · ${order.credits} Credits · ${order.priceEur.toFixed(2)} € (kein Mint)`,
  )
  if (!credited) {
    restoreProtocolSnapshot(snap)
    return null
  }
  return credited
}

export function simulatePacksSoldOut(): boolean {
  return protocolSimulatePacksSoldOut()
}

export interface SwipeBudget {
  day: string
  used: number
  extra: number
  remaining: number
  freeCap: number
  atCap: boolean
}

export function getSwipeBudget(): SwipeBudget {
  const s = get()
  const remaining = Math.max(0, FREE_SWIPES_PER_DAY + s.extraSwipes - s.swipesUsed)
  return {
    day: s.swipeDay,
    used: s.swipesUsed,
    extra: s.extraSwipes,
    remaining,
    freeCap: FREE_SWIPES_PER_DAY,
    atCap: remaining <= 0,
  }
}

/** Consume one free/extra swipe. Returns false when today's allowance is exhausted. */
export function consumeSwipe(): boolean {
  if (creditsClosed()) return true
  const next = structuredClone(get())
  const remaining = FREE_SWIPES_PER_DAY + next.extraSwipes - next.swipesUsed
  if (remaining <= 0) return false
  next.swipesUsed += 1
  if (!next.meaningfulAt) next.meaningfulAt = new Date().toISOString()
  commit(next)
  return true
}

export function hasTravelDeepScan(): boolean {
  return get().travelScanDay === todayKey()
}

export function boostCost(kind: CreditSpendKind): number {
  const base = CREDITS_COSTS[kind].credits
  if (!CREDITS_BOOST_KINDS.includes(kind)) return base
  try {
    if (!getSignupIdentity()?.earlyTester) return base
  } catch {
    return base
  }
  return Math.max(1, Math.round(base * (1 - EARLY_BOOST_DISCOUNT)))
}

export async function buyBoost(kind: CreditSpendKind): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (consumeFreeMonthlyBoost(kind)) return getCredits()
  const meta = CREDITS_COSTS[kind]
  const cost = boostCost(kind)
  const label =
    cost < meta.credits ? `${meta.label} · Early −20% (${cost})` : meta.label
  return spendCredits(cost, kind, label)
}

/** Boosts that cost Credits — never core discovery. */
export const CREDITS_BOOST_KINDS: CreditSpendKind[] = [
  'featured',
  'extra_swipes',
  'travel_scan',
  'social_boost',
  'interview_slot',
  'look_tryon',
  'look_shop',
]

export const FREE_ASSIST_PER_DAY = 8

export function markMeaningfulAction() {
  const next = structuredClone(get())
  if (next.meaningfulAt) return
  next.meaningfulAt = new Date().toISOString()
  commit(next)
}

export function hasMeaningfulAction() {
  return Boolean(get().meaningfulAt)
}

/** Pro Assist burns. While credits are off this never writes the ledger. */
export const PRO_ASSIST_BURNS = [5, 25, 40] as const
export type ProAssistBurn = (typeof PRO_ASSIST_BURNS)[number]

export async function spendProAssist(burn: ProAssistBurn): Promise<CreditsState | null> {
  if (creditsClosed()) return null
  if (!PRO_ASSIST_BURNS.includes(burn)) return null
  return spendCredits(burn, 'assist_priority', `Assist Pro (${burn})`)
}

/** Extra Assist after the free daily lane. Credits off: honest daily limit, no charge, no paywall. */
export async function consumeAssistTurn(): Promise<'ok' | 'paid' | 'need_credits' | 'limit'> {
  const next = structuredClone(get())
  const day = todayKey()
  if (next.assistDay !== day) {
    next.assistDay = day
    next.assistUsed = 0
  }
  if ((next.assistUsed ?? 0) < FREE_ASSIST_PER_DAY) {
    next.assistUsed = (next.assistUsed ?? 0) + 1
    commit(next)
    return 'ok'
  }
  if (creditsClosed() || kidsCreditsFrozen()) return 'limit'
  const paid = await spendCredits(
    CREDITS_COSTS.assist_priority.credits,
    'assist_priority',
    CREDITS_COSTS.assist_priority.label,
  )
  return paid ? 'paid' : 'need_credits'
}

function monthKey() {
  return todayKey().slice(0, 7)
}

function consumeFreeMonthlyBoost(kind: CreditSpendKind): boolean {
  if (!CREDITS_BOOST_KINDS.includes(kind)) return false
  const next = structuredClone(get())
  const month = monthKey()
  if (next.boostMonth !== month) {
    next.boostMonth = month
    next.freeBoostUsed = false
  }
  if (next.freeBoostUsed) return false
  applySpendSideEffects(next, kind)
  next.freeBoostUsed = true
  next.boostMonth = month
  if (!next.meaningfulAt) next.meaningfulAt = new Date().toISOString()
  next.txs.unshift({
    id: uid('cr'),
    type: 'spend',
    amount: 0,
    kind,
    label: `${CREDITS_COSTS[kind].label} · 1. Boost/Monat frei`,
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return true
}

export const CREDITS_COSTS: Record<CreditSpendKind, { credits: number; label: string }> = {
  featured: { credits: 40, label: 'Listing boosten (7 Tage Demo)' },
  extra_swipes: { credits: 25, label: `+${EXTRA_SWIPES_PACK} Extra-Swipes (heute)` },
  travel_scan: { credits: 15, label: 'Reise: beste Preise Deep-Scan (heute)' },
  social_boost: { credits: 20, label: 'Social-Post featured (Demo)' },
  interview_slot: { credits: 30, label: 'Priority-Interview-Slot (Demo)' },
  booking: { credits: 25, label: 'Reise-Buchung (Demo-Pauschale)' },
  unlock_message: { credits: 5, label: 'Nachricht freischalten (Demo)' },
  demo_gig: { credits: 20, label: 'Demo-Gig buchen' },
  sponsor_fee: { credits: 1, label: 'Sponsoring-Gebühr (Burn)' },
  look_tryon: { credits: 15, label: 'Kabine: Extra-Varianten (heute)' },
  look_shop: { credits: 20, label: 'Kabine: Nearby-Shop featuren (Demo)' },
  assist_priority: { credits: 8, label: 'Assist extra (nach 8 frei/Tag)' },
}

export const CREDITS_FREE_DE = [
  'Assist fragen',
  `Match browsen + ${FREE_SWIPES_PER_DAY} Swipes / Tag`,
  'Kabine Basis (Foto + 1–2 Varianten)',
  'Chat (Match / Booking / Support)',
  'Wallet ansehen',
  'Social lesen',
]

export const CREDITS_FREE_EN = [
  'Ask Assist',
  `Browse Match + ${FREE_SWIPES_PER_DAY} swipes / day`,
  'Kabine base (photo + 1–2 variants)',
  'Chat (Match / Booking / Support)',
  'Wallet view',
  'Read Social',
]

export const CREDITS_DISCLAIMER_DE =
  'Orbit Credits: hartes Cap 21.000.000. Nur Demo/Boost/Kosmetik — kein Lohnersatz und kein echtes EUR. Demo (VITE_APP_MODE=demo) nutzt localStorage (append-only, balance = Summe). Prod schreibt Intents erst nach Server-ok; ohne Supabase-Keys hard-fail (kein lokales Mint). Dieser Client mint nie über den Cap. Pack-Kauf ist ein Stub (kein Stripe/PayPal). Kern-Entdeckung bleibt kostenlos. Soft-Paywall nur an Geld-Momenten.'

export const CREDITS_DISCLAIMER_EN =
  'Orbit Credits: hard cap 21,000,000. Demo/boost/cosmetics only — not a wage substitute and not real EUR. Demo (VITE_APP_MODE=demo) uses localStorage (append-only, balance = sum). Prod writes intents only after server ok; missing Supabase keys hard-fail (no local mint). This client never mints above the cap. Pack purchase is a stub (no Stripe/PayPal). Core discovery stays free. Soft paywall only at money moments.'

export const EARLY_TESTER_COPY_DE = `Die ersten 50 Signups sind Early Testers (${EARLY_TESTER_GRANT.toLocaleString('de-DE')} Credits, 10× Welcome) plus −${Math.round(EARLY_BOOST_DISCOUNT * 100)} % Boost-Preis für immer. Ab Signup 51: ${WELCOME_GRANT} Credits.`
