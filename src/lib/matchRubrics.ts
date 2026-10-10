/**
 * Primary Match UX rubrics — “Match finden in …”
 * Marketplace tools (minijob, sell-by-photo, courier…) stay secondary.
 */
import type { Listing, Profile } from '../types'
import { deriveMarketType, listingHaystack } from './market'
import type { SocialPost } from './social'

export type MatchRubric =
  | 'jobs'
  | 'social'
  | 'food'
  | 'partnership'
  | 'friendship'
  | 'ausgehen'

export const MATCH_RUBRICS: MatchRubric[] = [
  'jobs',
  'social',
  'food',
  'partnership',
  'friendship',
  'ausgehen',
]

const FOOD_TERMS = [
  'essen',
  'trinken',
  'restaurant',
  'café',
  'cafe',
  'gastro',
  'kaffee',
  'imbiss',
  'kochen',
  'küche',
  'kueche',
  'pizza',
  'getränk',
  'getraenk',
  'barista',
  'mahlzeit',
]

const AUSGEHEN_TERMS = [
  'ausgehen',
  'party',
  'feier',
  'club',
  'sport',
  'fitness',
  'verein',
  'vereine',
  'freizeit',
  'hobby',
  'konzert',
  'kino',
  'tanzen',
  'fußball',
  'fussball',
  'yoga',
  'wandern',
  'nachmittag',
  'stammtisch',
]

const FRIENDSHIP_TERMS = [
  'freundschaft',
  'freund',
  'freunde',
  'kennenlernen',
  'plaudern',
  'spazieren',
  'buddy',
  'kumpel',
  'netzwerken',
  'social',
]

export function parseMatchRubric(raw: string | null | undefined): MatchRubric {
  if (raw && (MATCH_RUBRICS as string[]).includes(raw)) return raw as MatchRubric
  // Legacy hub lane query → nearest rubric
  if (raw === 'job' || raw === 'minijob') return 'jobs'
  if (raw === 'partnership' || raw === 'b2b') return 'partnership'
  return 'jobs'
}

function hayHasAny(hay: string, terms: string[]) {
  return terms.some((term) => hay.includes(term))
}

export function listingMatchesRubric(listing: Listing, rubric: MatchRubric): boolean {
  const lane = deriveMarketType(listing)
  const hay = listingHaystack(listing)
  switch (rubric) {
    case 'jobs':
      return lane === 'job' || lane === 'minijob'
    case 'food':
      return hayHasAny(hay, FOOD_TERMS) || listing.industry === 'Gastro / Hotel'
    case 'partnership':
      return lane === 'partnership' || lane === 'b2b'
    case 'friendship':
      return hayHasAny(hay, FRIENDSHIP_TERMS) || (listing.tags || []).some((t) => /freund/i.test(t))
    case 'ausgehen':
      return hayHasAny(hay, AUSGEHEN_TERMS) || (listing.tags || []).some((t) => /party|sport|verein|freizeit|ausgehen/i.test(t))
    case 'social':
      // Offers/requests that are marketplace “social market” style (not pure jobs)
      return listing.kind === 'offer' || listing.kind === 'request'
        ? lane === 'service' ||
            lane === 'sell' ||
            lane === 'barter' ||
            lane === 'asset' ||
            Boolean(listing.offerTags?.length || listing.needTags?.length)
        : false
    default:
      return true
  }
}

export function profileMatchesRubric(profile: Profile, rubric: MatchRubric): boolean {
  if (rubric === 'friendship' || rubric === 'ausgehen') {
    const hay = `${profile.bio} ${profile.crafts.join(' ')}`.toLowerCase()
    if (rubric === 'friendship') return hayHasAny(hay, FRIENDSHIP_TERMS) || profile.role === 'freelancer'
    return hayHasAny(hay, AUSGEHEN_TERMS) || profile.crafts.some((c) => /sport|freizeit|party/i.test(c))
  }
  if (rubric === 'jobs') return profile.role === 'freelancer' || profile.role === 'courier'
  if (rubric === 'partnership') return profile.role === 'company' || profile.role === 'agency'
  return false
}

/** Social posts that look like Angebot/Gesuch for the Social Market rubric. */
export function socialPostIsMarket(post: SocialPost): boolean {
  const body = post.body.toLowerCase()
  if (post.listingId) return true
  return /\b(suche|biete|angebot|gesuch|looking for|offer|need|co-marketing|open for)\b/i.test(body)
}

export function rubricHint(rubric: MatchRubric): { de: string; en: string } {
  switch (rubric) {
    case 'jobs':
      return { de: 'Jobs & Minijobs — swipen zum Interesse.', en: 'Jobs & minijobs — swipe for interest.' }
    case 'social':
      return {
        de: 'Social Market (Orbit Social): Angebote & Gesuche — Feed-UI bleibt auf Orbit Social.',
        en: 'Social Market (Orbit Social): offers & needs — feed UI stays on Orbit Social.',
      }
    case 'food':
      return { de: 'Essen & Trinken — lokale Treffer.', en: 'Food & drink — local hits.' }
    case 'partnership':
      return { de: 'Partnerschaften & B2B.', en: 'Partnerships & B2B.' }
    case 'friendship':
      return { de: 'Freundschaft & Kennenlernen.', en: 'Friendship & meeting people.' }
    case 'ausgehen':
      return {
        de: 'Ausgehen: Party, Sport, Freizeit, Vereine in der Nähe.',
        en: 'Going out: party, sports, leisure, local clubs.',
      }
  }
}
