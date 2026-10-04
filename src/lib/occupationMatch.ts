import type { Listing, Profile } from '../types'
import {
  hasRealLifeChoice,
  lifeExampleHit,
  lifeHay,
  listingIsAlcohol,
  pretendsFulfilled,
  sentenceHit,
  type LifeChoice,
} from './lifeHome'

/** What Prefs stored. Match does not import the occupation catalog. */
export interface OccupationIntent extends LifeChoice {
  occupations?: string[]
  occupationTerms?: string[]
  occupationOther?: string
  industries?: string[]
  lifeExamples?: string[]
  lifeSentence?: string
}

export function hasOccupationIntent(intent: OccupationIntent | null | undefined): boolean {
  return hasRealLifeChoice(intent)
}

export function occupationHaystack(parts: Array<string | undefined | null>): string {
  return lifeHay(parts)
}

function termHit(hay: string, intent: OccupationIntent): boolean {
  const other = (intent.occupationOther ?? '').trim().toLowerCase()
  if (other.length > 1 && hay.includes(other)) return true
  return (intent.occupationTerms ?? []).some((term) => {
    const needle = term.trim().toLowerCase()
    return needle.length > 2 && hay.includes(needle)
  })
}

function industryHit(industry: string | undefined, industries: string[] | undefined): boolean {
  if (!industry || !industries?.length) return false
  const value = industry.toLowerCase()
  return industries.some((item) => item.toLowerCase() === value)
}

export function listingMatchesOccupationIntent(listing: Listing, intent: OccupationIntent): boolean {
  if (!hasOccupationIntent(intent)) return false
  const hay = occupationHaystack([
    listing.title,
    listing.description,
    listing.industry,
    ...(listing.tags ?? []),
    ...(listing.crafts ?? []),
  ])
  if (lifeExampleHit(hay, intent.lifeExamples)) return true
  if (sentenceHit(hay, intent.lifeSentence)) return true
  if (termHit(hay, intent)) return true
  if ((intent.occupations?.length ?? 0) > 0) return industryHit(listing.industry, intent.industries)
  return false
}

export function listingVisibleForChoice(listing: Listing, intent: OccupationIntent, adult: boolean): boolean {
  if (pretendsFulfilled(listing)) return false
  if (!adult && listingIsAlcohol(listing)) return false
  return listingMatchesOccupationIntent(listing, intent)
}

export function profileMatchesOccupationIntent(profile: Profile, intent: OccupationIntent): boolean {
  if (!hasOccupationIntent(intent)) return false
  if ((intent.lifeExamples?.length ?? 0) > 0 || (intent.lifeSentence ?? '').trim().length > 1) {
    if ((intent.occupations?.length ?? 0) === 0 && (intent.occupationTerms?.length ?? 0) === 0 && !(intent.occupationOther ?? '').trim()) {
      return false
    }
  }
  const hay = occupationHaystack([
    profile.name,
    profile.bio,
    profile.role,
    profile.companyName,
    ...(profile.crafts ?? []),
    ...(profile.certifications ?? []),
  ])
  return termHit(hay, intent)
}

export function intentForMatch(prefs: {
  side: string
  seeker: OccupationIntent
  employer: OccupationIntent
}): OccupationIntent {
  const side = prefs.side === 'employer' ? prefs.employer : prefs.seeker
  return {
    occupations: side.occupations,
    occupationTerms: side.occupationTerms,
    occupationOther: side.occupationOther,
    industries: side.industries,
    lifeExamples: prefs.seeker.lifeExamples,
    lifeSentence: prefs.seeker.lifeSentence,
  }
}
