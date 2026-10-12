import type { Listing } from '../types'
import { deriveMarketType, isMarketplaceLane } from './market'
import { filterMarketplaceByPrefs, filterListingsByPrefs, getPrefs, isCompanySide, type OrbitPrefs } from './prefs'
import { grantSearchActivity } from './rewards'
import { isFlagOn } from './flags'
import { listTravelOffers, type TravelOffer } from './travel'
import { channelBoostForText } from './channels'

const KEY = 'orbit_behavior_v1'
const EVT = 'orbit-behavior-changed'
const MAX_EVENTS = 220

export type BehaviorKind = 'view' | 'swipe_skip' | 'swipe_interest' | 'apply' | 'search' | 'assist'

export interface BehaviorEvent {
  kind: BehaviorKind
  listingId?: string
  industry?: string
  jobType?: string
  city?: string
  query?: string
  at: string
}

export interface BehaviorState {
  events: BehaviorEvent[]
}

function defaultState(): BehaviorState {
  return { events: [] }
}

function load(): BehaviorState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as BehaviorState
    return { events: Array.isArray(parsed.events) ? parsed.events : [] }
  } catch {
    return defaultState()
  }
}

let cache: BehaviorState | null = null
function get(): BehaviorState {
  if (!cache) cache = load()
  return cache
}
function commit(next: BehaviorState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeBehavior(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getBehavior(): BehaviorState {
  return structuredClone(get())
}

export function trackBehavior(partial: Omit<BehaviorEvent, 'at'>) {
  const next = structuredClone(get())
  next.events.unshift({ ...partial, at: new Date().toISOString() })
  next.events = next.events.slice(0, MAX_EVENTS)
  commit(next)
  if (
    partial.kind === 'view' ||
    partial.kind === 'swipe_interest' ||
    partial.kind === 'search' ||
    partial.kind === 'assist'
  ) {
    void grantSearchActivity()
  }
}

export function recentAssistQueries(limit = 8): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of get().events) {
    if (e.kind !== 'assist' && e.kind !== 'search') continue
    const q = (e.query || '').trim()
    if (!q) continue
    const key = q.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(q)
    if (out.length >= limit) break
  }
  return out
}

export function isEventSectorListing(listing: Listing): boolean {
  const industry = listing.industry || ''
  if (industry.toLowerCase().startsWith('event')) return true
  if (listing.vertical !== 'job') return true
  const hay = [...(listing.crafts || []), ...(listing.tags || []), listing.title]
    .join(' ')
    .toLowerCase()
  return ['lichttechnik', 'tontechnik', 'rigging', 'grandma', 'stagehand', 'veranstaltungstechnik', 'foh /'].some(
    (k) => hay.includes(k),
  )
}

export function inferredSectors(events?: BehaviorEvent[]): Record<string, number> {
  const src = events ?? get().events
  const counts: Record<string, number> = {}
  for (const e of src) {
    if (!e.industry) continue
    const w = e.kind === 'apply' || e.kind === 'swipe_interest' ? 3 : e.kind === 'view' ? 1 : e.kind === 'swipe_skip' ? -1 : 1
    counts[e.industry] = (counts[e.industry] || 0) + w
  }
  return counts
}

export function rankForWorld(listings: Listing[], prefs?: OrbitPrefs): Listing[] {
  const p = prefs ?? getPrefs()
  const events = get().events
  const sectors = inferredSectors(events)
  const skipped = new Set(
    events.filter((e) => e.kind === 'swipe_skip' && e.listingId).map((e) => e.listingId as string),
  )
  const applied = new Set(
    events.filter((e) => e.kind === 'apply' && e.listingId).map((e) => e.listingId as string),
  )
  const viewed = new Set(
    events.filter((e) => e.kind === 'view' && e.listingId).map((e) => e.listingId as string),
  )
  const eventInterest =
    (p.seeker.industries || []).some((i) => i.startsWith('Event')) ||
    (p.employer.industries || []).some((i) => i.startsWith('Event')) ||
    Object.entries(sectors).some(([k, v]) => k.startsWith('Event') && v > 0)

  const filtered = filterListingsByPrefs(listings, p).filter((l) => l.status === 'active')

  const scored = filtered.map((l) => {
    let score = 12
    const industry = l.industry || ''
    if (industry && (p.seeker.industries || []).includes(industry as never)) score += 28
    if (industry && sectors[industry]) score += Math.min(24, sectors[industry] * 4)
    if (l.jobType && (p.seeker.jobTypes || []).includes(l.jobType as never)) score += 8
    if (isFlagOn('credits') && l.featured) score += 4
    if (l.jobType === 'Minijob' && (p.seeker.jobTypes || []).includes('Minijob')) score += 6
    if (l.country && l.country !== 'Deutschland') score += 3
    if (l.workMode === 'remote') score += 2
    if (isEventSectorListing(l) && !eventInterest) score -= 70
    if (skipped.has(l.id)) score -= 40
    if (applied.has(l.id)) score -= 25
    if (viewed.has(l.id) && !applied.has(l.id)) score -= 6
    if (l.vertical !== 'job') score -= 50
    return { l, score }
  })

  const kept = scored.filter((x) => x.score > -15)
  const pool = kept.length >= 3 ? kept : scored
  return pool.sort((a, b) => b.score - a.score).map((x) => x.l)
}

export function hideNoise(listings: Listing[]): Listing[] {
  return rankForWorld(listings).filter((l) => l.vertical === 'job')
}

/** Calm Home world for company mode — complementary B2B/partners/services, still ≤4 at call site. */
export function rankForCompanyWorld(listings: Listing[], prefs?: OrbitPrefs): Listing[] {
  const p = prefs ?? getPrefs()
  const eventOk = (p.employer.industries || []).some((i) => i.startsWith('Event'))
  const scored = listings
    .filter((l) => l.status === 'active')
    .map((l) => {
      const lane = deriveMarketType(l)
      let score = 8
      const industry = l.industry || ''
      if (industry && (p.employer.industries || []).includes(industry as never)) score += 24
      if (lane === 'partnership') score += 10
      if (lane === 'b2b') score += 8
      if (lane === 'service') score += 6
      if (lane === 'asset') score += 3
      if (l.kind === 'request') score += 5
      if (isFlagOn('credits') && l.featured) score += 3
      if (isMarketplaceLane(l)) score += 4
      if (isEventSectorListing(l) && !eventOk) score -= 55
      return { l, score }
    })
  return scored.sort((a, b) => b.score - a.score).map((x) => x.l)
}

export type TopDealKind = 'listing' | 'travel'

export interface RankedDeal {
  id: string
  kind: TopDealKind
  listing?: Listing
  offer?: TravelOffer
  reason: string
}

function hay(listing: Listing) {
  return [listing.title, listing.description, listing.industry, listing.jobType, listing.city, ...(listing.tags || []), ...(listing.crafts || [])]
    .join(' ')
    .toLowerCase()
}

function queryHits(text: string, queries: string[]) {
  const t = text.toLowerCase()
  return queries.find((q) => {
    const tokens = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    return tokens.some((w) => t.includes(w)) || t.includes(q.toLowerCase())
  })
}

function dealReason(
  locale: 'de' | 'en',
  code: 'prefs' | 'assist' | 'swipe' | 'role' | 'featured' | 'travel' | 'city' | 'channel',
  detail?: string,
): string {
  const de = locale === 'de'
  switch (code) {
    case 'prefs':
      return de
        ? `Passt zu deinen Prefs${detail ? ` · ${detail}` : ''}`
        : `Matches your prefs${detail ? ` · ${detail}` : ''}`
    case 'assist':
      return de
        ? `Zu deiner Suche „${detail}“`
        : `From your search “${detail}”`
    case 'swipe':
      return de ? 'Ähnlich wie Karten, die du geliked hast' : 'Similar to cards you liked'
    case 'role':
      return de ? (detail ?? 'Passend zu deiner Rolle') : (detail ?? 'Fits your role')
    case 'featured':
      return de ? 'Hervorgehoben in Allda' : 'Featured on Allda'
    case 'travel':
      return de ? 'Günstige Reise — aus Prefs & Suchen' : 'Travel deal from prefs & searches'
    case 'city':
      return de ? `In ${detail}` : `In ${detail}`
    case 'channel':
      return de
        ? `Zu verbundenem Kanal ${detail} (Demo-Stub, kein Scraping)`
        : `From linked channel ${detail} (demo stub, no scraping)`
  }
}

/**
 * Home Top Deals — 3–4 cards across job / service / travel / B2B.
 * Ranked from prefs, role, recent Assist queries, swipes/applies.
 */
export function rankTopDeals(
  listings: Listing[],
  prefs?: OrbitPrefs,
  locale: 'de' | 'en' = 'de',
  limit = 4,
): RankedDeal[] {
  const p = prefs ?? getPrefs()
  const events = get().events
  const queries = recentAssistQueries()
  const sectors = inferredSectors(events)
  const skipped = new Set(events.filter((e) => e.kind === 'swipe_skip' && e.listingId).map((e) => e.listingId as string))
  const applied = new Set(events.filter((e) => e.kind === 'apply' && e.listingId).map((e) => e.listingId as string))
  const likedIndustries = Object.entries(sectors)
    .filter(([, v]) => v > 0)
    .map(([k]) => k)
  const company = isCompanySide(p.side) && p.side !== 'both'
  const eventInterest =
    (p.seeker.industries || []).some((i) => i.startsWith('Event')) ||
    (p.employer.industries || []).some((i) => i.startsWith('Event')) ||
    likedIndustries.some((k) => k.startsWith('Event'))
  const seekerIndustries = p.seeker.industries || []
  const employerIndustries = p.employer.industries || []
  const cities = [...(p.seeker.cities || [])]
  const assistTravel = queries.some((q) => /flug|hotel|reise|bahn|mietwagen|flight|train|stay/i.test(q))

  let pool = filterMarketplaceByPrefs(listings, p, 'all').filter((l) => l.status === 'active')
  if (pool.length < 4) {
    pool = listings.filter((l) => l.status === 'active')
  }

  type Scored = { deal: RankedDeal; score: number }
  const scored: Scored[] = []

  for (const l of pool) {
    if (skipped.has(l.id) || applied.has(l.id)) continue
    const lane = deriveMarketType(l)
    const industry = l.industry || ''
    let score = 10
    let reason = dealReason(locale, 'role', company
      ? locale === 'de' ? 'B2B / Partner für eure Firma' : 'B2B / partners for your company'
      : locale === 'de' ? 'Jobs & Services für dich' : 'Jobs & services for you')

    if (company) {
      if (lane === 'partnership' || lane === 'b2b') score += 16
      if (lane === 'service') score += 8
      if (lane === 'job' || lane === 'minijob') score -= 8
      if (industry && employerIndustries.includes(industry as never)) {
        score += 28
        reason = dealReason(locale, 'prefs', industry)
      }
    } else {
      if (lane === 'job' || lane === 'minijob' || lane === 'service') score += 12
      if (lane === 'b2b' || lane === 'partnership') score += 6
      if (industry && seekerIndustries.includes(industry as never)) {
        score += 28
        reason = dealReason(locale, 'prefs', industry)
      }
    }

    if (industry && sectors[industry] > 0) {
      score += Math.min(22, sectors[industry] * 4)
      if (!seekerIndustries.includes(industry as never) && !employerIndustries.includes(industry as never)) {
        reason = dealReason(locale, 'swipe')
      }
    }

    const hit = queryHits(hay(l), queries)
    if (hit) {
      score += 32
      reason = dealReason(locale, 'assist', hit.length > 42 ? `${hit.slice(0, 40)}…` : hit)
    }

    if (l.city && cities.some((c) => c.toLowerCase() === l.city.toLowerCase())) {
      score += 10
      if (reason.startsWith('Passt zu deiner Rolle') || reason.startsWith('Fits your role') || reason.startsWith('Jobs') || reason.startsWith('B2B')) {
        reason = dealReason(locale, 'city', l.city)
      }
    }

    if (isFlagOn('credits') && l.featured) {
      score += 5
      if (score < 20) reason = dealReason(locale, 'featured')
    }

    const ch = channelBoostForText(hay(l))
    if (ch.score) {
      score += ch.score
      reason = dealReason(locale, 'channel', ch.label)
    }

    const eventish = Boolean(industry && industry.toLowerCase().startsWith('event'))
    if (eventish && !eventInterest) score -= 50

    scored.push({
      score,
      deal: { id: l.id, kind: 'listing', listing: l, reason },
    })
  }

  const travelBoost = assistTravel || queries.length === 0
  if (travelBoost || !company) {
    const offers = listTravelOffers()
    for (const o of offers) {
      let score = travelBoost ? 14 : 6
      let reason = dealReason(locale, 'travel')
      const text = `${o.title} ${o.to} ${o.from || ''} ${o.tags.join(' ')} ${o.kind}`
      const hit = queryHits(text, queries)
      if (hit) {
        score += 36
        reason = dealReason(locale, 'assist', hit.length > 42 ? `${hit.slice(0, 40)}…` : hit)
      }
      if (o.tags.some((t) => /günstig/i.test(t))) score += 6
      const ch = channelBoostForText(text)
      if (ch.score) {
        score += ch.score
        reason = dealReason(locale, 'channel', ch.label)
      }
      if (cities.some((c) => o.to.toLowerCase() === c.toLowerCase())) {
        score += 12
        reason = dealReason(locale, 'city', o.to)
      }
      if (company && !hit && !assistTravel) score -= 8
      scored.push({
        score,
        deal: { id: o.id, kind: 'travel', offer: o, reason },
      })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  const picked: RankedDeal[] = []
  const kinds = new Set<string>()
  for (const row of scored) {
    const laneKey = row.deal.kind === 'travel'
      ? 'travel'
      : deriveMarketType(row.deal.listing!)
    // Prefer category mix so Home isn't a job dump.
    if (picked.length >= 2 && kinds.has(laneKey) && kinds.size < 3) continue
    picked.push(row.deal)
    kinds.add(laneKey)
    if (picked.length >= limit) break
  }
  if (picked.length < Math.min(limit, 3)) {
    for (const row of scored) {
      if (picked.some((d) => d.id === row.deal.id)) continue
      picked.push(row.deal)
      if (picked.length >= limit) break
    }
  }
  return picked.slice(0, limit)
}
