/**
 * Affiliate / partner deep-links when env keys exist; otherwise neutral public search URLs.
 */
import {
  bahnSearchUrl,
  carSearchUrl,
  flightSearchUrl,
  hotelSearchUrl,
  packageSearchUrl,
  stripAffiliateParams,
} from '../travelConnectors'
import type { TravelKind } from '../travel'
import { bookingAffiliateId, ebayCampaignId, skyscannerMediaPartnerId } from './partnerEnv'

function iataGuess(city: string): string {
  const c = city.trim().toLowerCase()
  const map: Record<string, string> = {
    berlin: 'ber',
    münchen: 'mun',
    muenchen: 'mun',
    frankfurt: 'fra',
    hamburg: 'ham',
    köln: 'cgn',
    koeln: 'cgn',
    düsseldorf: 'dus',
    duesseldorf: 'dus',
  }
  for (const [key, code] of Object.entries(map)) {
    if (c.includes(key)) return code
  }
  return encodeURIComponent(city.trim().toLowerCase().replace(/\s+/g, '-'))
}

export function skyscannerFlightUrl(from: string, to: string, dateIso?: string, locale: 'de' | 'en' = 'de') {
  if (!from.trim() || !to.trim()) {
    return stripAffiliateParams(flightSearchUrl(from, to, dateIso, locale))
  }
  const ymd = dateIso?.replace(/-/g, '') || 'any'
  const url = new URL(
    `https://www.skyscanner.de/transport/flights/${iataGuess(from)}/${iataGuess(to)}/${ymd}/`,
  )
  const partner = skyscannerMediaPartnerId()
  if (partner) url.searchParams.set('mediaPartnerId', partner)
  url.searchParams.set('locale', locale === 'de' ? 'de-DE' : 'en-GB')
  return url.toString()
}

export function bookingHotelUrl(to: string, dateIso?: string) {
  const base = hotelSearchUrl(to, dateIso)
  const aid = bookingAffiliateId()
  if (!aid) return stripAffiliateParams(base)
  try {
    const url = new URL(base)
    url.searchParams.set('aid', aid)
    return url.toString()
  } catch {
    return base
  }
}

export function travelBookingUrl(
  kind: TravelKind,
  input: { from?: string; to: string; dateIso?: string },
  locale: 'de' | 'en' = 'de',
): string {
  const from = input.from || ''
  const to = input.to
  const dateIso = input.dateIso
  switch (kind) {
    case 'rail':
      return bahnSearchUrl(from, to, dateIso)
    case 'flight':
      return skyscannerFlightUrl(from, to, dateIso, locale)
    case 'hotel':
      return bookingHotelUrl(to || from, dateIso)
    case 'car':
      return stripAffiliateParams(carSearchUrl(to || from, dateIso))
    case 'package':
      return stripAffiliateParams(packageSearchUrl(from, to || from, dateIso, locale))
    default:
      return skyscannerFlightUrl(from, to, dateIso, locale)
  }
}

/** Public job search at Bundesagentur — no scrape, user completes search there. */
export function arbeitsagenturJobSearchUrl(query: string, location?: string) {
  const url = new URL('https://www.arbeitsagentur.de/jobsuche/suche')
  if (query.trim()) url.searchParams.set('was', query.trim())
  if (location?.trim()) url.searchParams.set('wo', location.trim())
  return url.toString()
}

export function indeedJobSearchUrl(query: string, location?: string) {
  const url = new URL('https://de.indeed.com/jobs')
  if (query.trim()) url.searchParams.set('q', query.trim())
  if (location?.trim()) url.searchParams.set('l', location.trim())
  return url.toString()
}

export function ebayPartnerSearchUrl(query: string) {
  const q = query.trim()
  const url = new URL('https://www.ebay.de/sch/i.html')
  url.searchParams.set('_nkw', q || 'gebraucht')
  const camp = ebayCampaignId()
  if (camp) url.searchParams.set('campid', camp)
  return url.toString()
}
