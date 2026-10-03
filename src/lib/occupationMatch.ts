import type { Listing, Profile } from '../types'

/** What Prefs stored. Match does not import the occupation catalog. */
export interface OccupationIntent {
  occupations?: string[]
  occupationTerms?: string[]
  occupationOther?: string
  industries?: string[]
}

export function hasOccupationIntent(intent: OccupationIntent | null | undefined): boolean {
  if (!intent) return false
  if ((intent.occupations?.length ?? 0) > 0) return true
  if ((intent.occupationTerms?.length ?? 0) > 0) return true
  if ((intent.occupationOther ?? '').trim().length > 1) return true
  if ((intent.industries?.length ?? 0) > 0) return true
  return false
}

export function occupationHaystack(parts: Array<string | undefined | null>): string {
  return parts
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLowerCase()
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
    listing.city,
    ...(listing.tags ?? []),
    ...(listing.crafts ?? []),
  ])
  if (termHit(hay, intent)) return true
  return industryHit(listing.industry, intent.industries)
}

export function profileMatchesOccupationIntent(profile: Profile, intent: OccupationIntent): boolean {
  if (!hasOccupationIntent(intent)) return false
  const hay = occupationHaystack([
    profile.name,
    profile.bio,
    profile.role,
    profile.companyName,
    profile.city,
    ...(profile.crafts ?? []),
    ...(profile.certifications ?? []),
  ])
  return termHit(hay, intent)
}
