/**
 * Allda Credits protocol — Bitcoin-style hard cap (demo, client-side).
 *
 * MAX_SUPPLY = 21_000_000. The client ledger MUST never mint above this.
 * Real enforcement later needs a server or chain; this file still refuses
 * any grant that would breach the cap or an empty pool.
 *
 * Invariant: circulating + remainingReserve + burned === MAX_SUPPLY
 * remainingReserve === sum of unused pool balances.
 */
export const MAX_SUPPLY = 21_000_000
export const EARLY_TESTER_CAP = 50
export const EARLY_TESTER_GRANT = 2_000
export const WELCOME_GRANT = 200
/** Signup 51+ seats funded by the welcome pool (17_000 × 200). */
export const WELCOME_SEATS = 17_000
export const P2P_TAKE_RATE = 0.02
/** Tiny fee on gift/sponsoring — burned, not reminted. Min 1, else ~2%. */
export const SPONSOR_FEE = 1

/** Pre-issued to simulated peers so P2P can settle without minting. */
export const GENESIS_P2P_FLOAT = 100_000

export const DEMO_BASE_ACTIVE_USERS = 1_280

const PROTOCOL_KEY = 'orbit_credit_protocol_v2'
const IDENTITY_KEY = 'orbit_signup_ordinal_v1'
const EVT = 'orbit-credits-changed'

export type CreditPoolId = 'early' | 'welcome' | 'rewards' | 'packs' | 'treasury'

/** Genesis allocation — sums to MAX_SUPPLY with GENESIS_P2P_FLOAT. */
export const POOL_ALLOCATION: Record<CreditPoolId, number> = {
  early: EARLY_TESTER_CAP * EARLY_TESTER_GRANT, // 100_000
  welcome: WELCOME_SEATS * WELCOME_GRANT, // 3_400_000
  rewards: 4_500_000,
  // 3_000_000 moved from packs: +25_000 early + 2_975_000 welcome. Treasury unchanged.
  packs: 11_000_000,
  treasury: 1_900_000,
}

export const ALLOCATION_TABLE: {
  id: string
  labelDe: string
  amount: number
  noteDe: string
}[] = [
  {
    id: 'early',
    labelDe: 'Early Testers (Signup 1–50)',
    amount: POOL_ALLOCATION.early,
    noteDe: '2.000 Credits je Person, −20 % Boost für immer',
  },
  {
    id: 'welcome',
    labelDe: 'Welcome später (Signup 51+)',
    amount: POOL_ALLOCATION.welcome,
    noteDe: '200 Credits je Person, 17.000 Plätze',
  },
  {
    id: 'rewards',
    labelDe: 'Rewards-Pool (Leistung)',
    amount: POOL_ALLOCATION.rewards,
    noteDe: 'Prefs, Match, Referral, Reviews, Jobs — Transfer aus dem Pool, kein Extra-Mint',
  },
  {
    id: 'packs',
    labelDe: 'Packs (System-Mint)',
    amount: POOL_ALLOCATION.packs,
    noteDe: 'Solange Reserve > 0. Danach nur noch P2P',
  },
  {
    id: 'p2p',
    labelDe: 'P2P-Float (Genesis)',
    amount: GENESIS_P2P_FLOAT,
    noteDe: 'Bereits im Umlauf bei simulierten Nutzer:innen',
  },
  {
    id: 'treasury',
    labelDe: 'Treasury (unissued)',
    amount: POOL_ALLOCATION.treasury,
    noteDe: 'Ops / Reserve, kein User-Airdrop',
  },
]

export interface CreditPool {
  allocated: number
  remaining: number
}

export interface ProtocolState {
  circulating: number
  remainingReserve: number
  burned: number
  protocolHeld: number
  p2pFloat: number
  signupCount: number
  filledOrderIds: string[]
  seenOpIds: string[]
  pools: Record<CreditPoolId, CreditPool>
}

export interface SignupIdentity {
  ordinal: number
  earlyTester: boolean
}

export interface P2POrder {
  id: string
  seller: string
  credits: number
  priceEur: number
  note: string
}

export const P2P_ORDERS: P2POrder[] = [
  { id: 'p2p-nora', seller: 'Nora · Berlin', credits: 80, priceEur: 9.5, note: 'Early Tester #7' },
  { id: 'p2p-kai', seller: 'Kai · München', credits: 250, priceEur: 22, note: 'Teilverkauf' },
  { id: 'p2p-12', seller: 'Early Tester #12', credits: 400, priceEur: 36, note: 'Aus Welcome-Rest' },
]

function poolSum(pools: Record<CreditPoolId, CreditPool>) {
  return (Object.keys(POOL_ALLOCATION) as CreditPoolId[]).reduce((n, id) => n + pools[id].remaining, 0)
}

function genesis(): ProtocolState {
  const pools = (Object.keys(POOL_ALLOCATION) as CreditPoolId[]).reduce(
    (acc, id) => {
      acc[id] = { allocated: POOL_ALLOCATION[id], remaining: POOL_ALLOCATION[id] }
      return acc
    },
    {} as Record<CreditPoolId, CreditPool>,
  )
  const remainingReserve = poolSum(pools)
  return {
    circulating: GENESIS_P2P_FLOAT,
    remainingReserve,
    burned: 0,
    protocolHeld: 0,
    p2pFloat: GENESIS_P2P_FLOAT,
    signupCount: 0,
    filledOrderIds: [],
    seenOpIds: [],
    pools,
  }
}

export function protocolInvariantHolds(p: ProtocolState): boolean {
  if (p.circulating < 0 || p.burned < 0 || p.remainingReserve < 0) return false
  if (p.p2pFloat < 0 || p.protocolHeld < 0) return false
  if (poolSum(p.pools) !== p.remainingReserve) return false
  if (p.circulating + p.remainingReserve + p.burned !== MAX_SUPPLY) return false
  if (p.circulating + p.burned > MAX_SUPPLY) return false
  for (const id of Object.keys(POOL_ALLOCATION) as CreditPoolId[]) {
    const pool = p.pools[id]
    if (pool.remaining < 0 || pool.remaining > pool.allocated) return false
  }
  return true
}

function normalize(raw: Partial<ProtocolState>): ProtocolState | null {
  const g = genesis()
  const pools = { ...g.pools }
  for (const id of Object.keys(POOL_ALLOCATION) as CreditPoolId[]) {
    const src = raw.pools?.[id]
    if (src && typeof src.remaining === 'number' && typeof src.allocated === 'number') {
      pools[id] = {
        allocated: POOL_ALLOCATION[id],
        remaining: Math.max(0, Math.min(POOL_ALLOCATION[id], Math.round(src.remaining))),
      }
    }
  }
  const remainingReserve = poolSum(pools)
  const burned = Math.max(0, Math.round(raw.burned ?? 0))
  const circulating = MAX_SUPPLY - remainingReserve - burned
  if (circulating < 0) return null
  const next: ProtocolState = {
    circulating,
    remainingReserve,
    burned,
    protocolHeld: Math.max(0, Math.round(raw.protocolHeld ?? 0)),
    p2pFloat: Math.max(0, Math.round(raw.p2pFloat ?? GENESIS_P2P_FLOAT)),
    signupCount: Math.max(0, Math.round(raw.signupCount ?? 0)),
    filledOrderIds: Array.isArray(raw.filledOrderIds) ? raw.filledOrderIds : [],
    seenOpIds: Array.isArray(raw.seenOpIds) ? raw.seenOpIds.slice(0, 80) : [],
    pools,
  }
  return protocolInvariantHolds(next) ? next : null
}

function load(): ProtocolState {
  try {
    const raw = localStorage.getItem(PROTOCOL_KEY)
    if (!raw) return genesis()
    const parsed = JSON.parse(raw) as Partial<ProtocolState>
    return normalize(parsed) ?? genesis()
  } catch {
    return genesis()
  }
}

let cache: ProtocolState | null = null

function get(): ProtocolState {
  if (!cache) cache = load()
  return cache
}

function commit(next: ProtocolState) {
  // assertCap: client invariant is a UX guardrail. P0 server/chain ledger is the source of truth.
  if (!protocolInvariantHolds(next)) {
    console.error('[orbit credits] invariant failed — refusing commit', next)
    return false
  }
  cache = next
  localStorage.setItem(PROTOCOL_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
  return true
}

export function getProtocol(): ProtocolState {
  return structuredClone(get())
}

export function remainingReserve(): number {
  return get().remainingReserve
}

export function packsRemain(amount: number): boolean {
  return get().pools.packs.remaining >= Math.max(0, Math.round(amount))
}

export function rewardsRemain(amount: number): boolean {
  return get().pools.rewards.remaining >= Math.max(0, Math.round(amount))
}

export function isPackMarketP2P(): boolean {
  return get().pools.packs.remaining <= 0 || get().remainingReserve <= 0
}

/** Point-in-time copy for atomic mint rollback (see restoreProtocolSnapshot). */
export function snapshotProtocol(): ProtocolState {
  return structuredClone(get())
}

/**
 * ATOMIC MINT / rollback (R3): restore circulating + pools after a failed wallet credit.
 * `mintFromPool` + `creditWallet` are not a DB transaction on the client. Callers
 * snapshot, debit the pool, then credit the wallet/ledger; if that credit fails
 * they MUST call this so the protocol debit does not leak. Production mint+user
 * credit is one SQL transaction in `apply_credit_intent` (server is source of truth).
 */
export function restoreProtocolSnapshot(snap: ProtocolState): boolean {
  if (!protocolInvariantHolds(snap)) {
    console.error('[orbit credits] refuse restore — invariant failed', snap)
    return false
  }
  return commit(structuredClone(snap))
}

/**
 * Mint from a pre-allocated pool into circulating. Fails if the pool or cap is exhausted.
 * Caller credits the user wallet by the same amount — wrap with snapshot + restore
 * so a failed wallet/ledger write cannot leave circulating moved (R3).
 */
export function mintFromPool(pool: CreditPoolId, amount: number, opId?: string): boolean {
  const amt = Math.max(0, Math.round(amount))
  if (amt === 0) return true
  const next = structuredClone(get())
  if (opId && next.seenOpIds.includes(opId)) return true
  if (next.pools[pool].remaining < amt) return false
  if (next.circulating + amt + next.burned > MAX_SUPPLY) return false
  next.pools[pool].remaining -= amt
  next.remainingReserve -= amt
  next.circulating += amt
  if (opId) next.seenOpIds = [opId, ...next.seenOpIds].slice(0, 80)
  return commit(next)
}

/** Boost spend: leave circulating (protocol held), never return to reserve. */
export function holdFromUser(amount: number): boolean {
  const amt = Math.max(0, Math.round(amount))
  if (amt === 0) return true
  const next = structuredClone(get())
  next.protocolHeld += amt
  return commit(next)
}

/** Gift/sponsoring: peer transfer into P2P float; tiny fee burned. */
export function peerTransferOut(amount: number): { net: number; burned: number } | null {
  const amt = Math.max(0, Math.round(amount))
  if (amt <= 0) return null
  const burned = Math.min(amt, Math.max(SPONSOR_FEE, Math.round(amt * P2P_TAKE_RATE)))
  const net = amt - burned
  const next = structuredClone(get())
  next.p2pFloat += net
  next.burned += burned
  next.circulating -= burned
  if (!commit(next)) return null
  return { net, burned }
}

/** Buy from simulated peers — no mint. */
export function takeFromP2P(amount: number, orderId?: string): boolean {
  const amt = Math.max(0, Math.round(amount))
  if (amt === 0) return true
  const next = structuredClone(get())
  if (next.p2pFloat < amt) return false
  if (orderId) {
    if (next.filledOrderIds.includes(orderId)) return false
    next.filledOrderIds.push(orderId)
  }
  next.p2pFloat -= amt
  return commit(next)
}

/**
 * Demo: remaining pack allocation is treated as sold to other users (moves into P2P float).
 * Does not mint above cap — circulating rises by the unsold pack remainder.
 */
export function simulatePacksSoldOut(): boolean {
  const next = structuredClone(get())
  const left = next.pools.packs.remaining
  if (left <= 0) return true
  next.pools.packs.remaining = 0
  next.remainingReserve -= left
  next.p2pFloat += left
  next.circulating += left
  return commit(next)
}

export function ensureSignupIdentity(): SignupIdentity {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SignupIdentity
      if (typeof parsed.ordinal === 'number' && parsed.ordinal >= 1) {
        return { ordinal: parsed.ordinal, earlyTester: parsed.ordinal <= EARLY_TESTER_CAP }
      }
    }
  } catch {
    /* assign new */
  }
  const next = structuredClone(get())
  next.signupCount += 1
  const ordinal = next.signupCount
  commit(next)
  const identity: SignupIdentity = { ordinal, earlyTester: ordinal <= EARLY_TESTER_CAP }
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
  return identity
}

export function getSignupIdentity(): SignupIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SignupIdentity
    if (typeof parsed.ordinal !== 'number') return null
    return { ordinal: parsed.ordinal, earlyTester: parsed.ordinal <= EARLY_TESTER_CAP }
  } catch {
    return null
  }
}

export function welcomeGrantFor(identity: SignupIdentity): { pool: CreditPoolId; amount: number; label: string } {
  if (identity.earlyTester) {
    return {
      pool: 'early',
      amount: EARLY_TESTER_GRANT,
      label: `Early Tester #${identity.ordinal} — ${EARLY_TESTER_GRANT.toLocaleString('de-DE')} Credits`,
    }
  }
  return {
    pool: 'welcome',
    amount: WELCOME_GRANT,
    label: `Willkommen · Signup #${identity.ordinal} — ${WELCOME_GRANT} Credits`,
  }
}

export function formatSupplyLine(p = get()): string {
  return `${p.circulating.toLocaleString('de-DE')} / 21M im Umlauf`
}

export function wertIndex(p = get()): { value: number; activeUsers: number; formula: string } {
  const activeUsers = DEMO_BASE_ACTIVE_USERS + p.signupCount
  const value =
    Math.round(100 * Math.log10(1 + activeUsers) * (1 + p.circulating / MAX_SUPPLY) * 10) / 10
  return {
    value,
    activeUsers,
    formula: '100 × log₁₀(1 + aktive Nutzer) × (1 + Umlauf / 21M) — Demo-Formel, kein Marktpreis',
  }
}

export function supplyMeterPct(p = get()): number {
  return Math.min(100, (p.circulating / MAX_SUPPLY) * 100)
}

/** Test helper — not used in UI. */
export function __resetProtocolForTests() {
  cache = null
  localStorage.removeItem(PROTOCOL_KEY)
  localStorage.removeItem(IDENTITY_KEY)
}
