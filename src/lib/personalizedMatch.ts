import type { Listing, Profile } from '../types'
import { inferredSectors, recentAssistQueries } from './behavior'
import { getCompany } from './company'
import { deriveMarketType } from './market'
import {
  scoreB2bMatch,
  scoreJobMatch,
  type MatchScore,
} from './match'
import { hasOccupationIntent, intentForMatch, listingVisibleForChoice } from './occupationMatch'
import { getPrefs, type OrbitPrefs } from './prefs'
import type { TravelOffer } from './travel'

export type PersonalizedKind = 'job' | 'service' | 'travel' | 'person'

export type PersonalizedItem =
  | { kind: 'job' | 'service'; id: string; listing: Listing; score: MatchScore; reason: string }
  | { kind: 'travel'; id: string; offer: TravelOffer; score: MatchScore; reason: string }
  | { kind: 'person'; id: string; profile: Profile; score: MatchScore; reason: string }

function queryHits(text: string, queries: string[]) {
  const t = text.toLowerCase()
  return queries.find((q) => {
    const tokens = q
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
    return tokens.some((w) => t.includes(w)) || t.includes(q.toLowerCase())
  })
}

/**
 * Match deck from a real occupation preference.
 * Empty or unknown prefs return nothing. Travel and sample people stay out.
 */
export function rankPersonalizedMatch(input: {
  listings: Listing[]
  profiles: Profile[]
  prefs?: OrbitPrefs
  userId?: string
  locale?: 'de' | 'en'
  skipIds?: Set<string>
  /** Same 18+ confirmation as Menschen treffen. Alcohol stays out while this is false. */
  adult?: boolean
}): PersonalizedItem[] {
  void input.profiles
  const prefs = input.prefs ?? getPrefs()
  const locale = input.locale ?? 'de'
  const de = locale === 'de'
  const intent = intentForMatch(prefs)
  const adult = input.adult === true
  if (!hasOccupationIntent(intent)) return []
  const queries = recentAssistQueries()
  const sectors = inferredSectors()
  const skip = input.skipIds ?? new Set<string>()
  const company = getCompany()
  const scored: Array<PersonalizedItem & { rank: number }> = []

  for (const listing of input.listings) {
    if (listing.status !== 'active' || skip.has(listing.id)) continue
    if (!listingVisibleForChoice(listing, intent, adult)) continue
    const lane = deriveMarketType(listing)
    const isJob = lane === 'job' || lane === 'minijob'
    const score = isJob ? scoreJobMatch(listing, prefs) : scoreB2bMatch(listing, prefs, company)
    let rank = score.percent
    const industry = listing.industry || ''
    if (industry && sectors[industry]) rank += Math.min(18, sectors[industry] * 3)
    const hay = [listing.title, listing.description, industry, listing.city, ...(listing.tags || [])].join(' ')
    const hit = queryHits(hay, queries)
    if (hit) rank += 22
    const reason = hit
      ? de
        ? `Zu deiner Suche „${hit.slice(0, 36)}“`
        : `From your search “${hit.slice(0, 36)}”`
      : score.reasons[0] || (isJob ? (de ? 'Passt zu Prefs' : 'Fits prefs') : de ? 'Service / Firma' : 'Service / company')
    scored.push({
      kind: isJob ? 'job' : 'service',
      id: listing.id,
      listing,
      score,
      reason,
      rank,
    })
  }

  scored.sort((a, b) => b.rank - a.rank)

  const picked: PersonalizedItem[] = []
  const kinds = new Set<PersonalizedKind>()
  for (const row of scored) {
    if (picked.length >= 2 && kinds.has(row.kind) && kinds.size < 3) continue
    picked.push(row)
    kinds.add(row.kind)
    if (picked.length >= 24) break
  }
  if (picked.length < 8) {
    for (const row of scored) {
      if (picked.some((p) => p.id === row.id)) continue
      picked.push(row)
      if (picked.length >= 24) break
    }
  }
  return picked.filter((item) => item.kind === 'job' || item.kind === 'service')
}

export function personalizedKinds(items: PersonalizedItem[]): PersonalizedKind[] {
  return [...new Set(items.map((i) => i.kind))]
}
