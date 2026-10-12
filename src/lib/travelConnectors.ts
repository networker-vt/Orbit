/**
 * Flüge / Bahn connectors.
 * Bahn is a bahn.de search link the user opens. No timetable API.
 * Flights have no free keyless inventory API — filled search links only.
 * Nothing here creates a booking or a price Allda did not receive.
 */

const AFFILIATE_KEYS = ['aid', 'affiliate', 'aff', 'aff_id', 'partner_id', 'partnerid', 'partner']

/** Drop partner and affiliate query parameters from a search link. */
export function stripAffiliateParams(href: string): string {
  try {
    const url = new URL(href)
    for (const key of [...url.searchParams.keys()]) {
      const lower = key.toLowerCase()
      if (AFFILIATE_KEYS.includes(lower) || lower.includes('affiliate')) url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return href
  }
}

export interface RailJourney {
  id: string
  departure: string
  arrival: string
  from: string
  to: string
  durationMin: number | null
  transfers: number
  lines: string[]
  /** Present only when the timetable API sent a price. */
  priceEur: number | null
  currency: string | null
}

export type TravelLinkKind = 'flight' | 'hotel' | 'rail' | 'car' | 'package'

export interface TravelSearchLink {
  kind: TravelLinkKind
  provider: string
  href: string
  /** Outbound search. Never a live fare or an in-app booking. */
  mode: 'empty-cta'
}

function hashSearch(params: Record<string, string>) {
  const hash = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) hash.set(key, value)
  }
  return hash.toString()
}

export function bahnSearchUrl(from: string, to: string, dateIso?: string) {
  const hash = hashSearch({
    sts: 'true',
    so: from.trim(),
    zo: to.trim(),
    hd: dateIso || '',
    ht: '08:00',
  })
  return stripAffiliateParams(`https://www.bahn.de/buchung/fahrplan/suche#${hash}`)
}

export function flightSearchUrl(from: string, to: string, dateIso?: string, locale: 'de' | 'en' = 'de') {
  const when = dateIso ? (locale === 'de' ? ` am ${dateIso}` : ` on ${dateIso}`) : ''
  const q =
    from.trim() && to.trim()
      ? locale === 'de'
        ? `Flüge von ${from.trim()} nach ${to.trim()}${when}`
        : `Flights from ${from.trim()} to ${to.trim()}${when}`
      : locale === 'de'
        ? 'Flüge'
        : 'Flights'
  const hl = locale === 'de' ? 'de' : 'en'
  return stripAffiliateParams(`https://www.google.com/travel/flights?hl=${hl}&q=${encodeURIComponent(q)}`)
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function hotelSearchUrl(to: string, dateIso?: string) {
  const url = new URL('https://www.booking.com/searchresults.html')
  if (to.trim()) url.searchParams.set('ss', to.trim())
  if (dateIso) {
    url.searchParams.set('checkin', dateIso)
    url.searchParams.set('checkout', addDays(dateIso, 1))
  }
  return stripAffiliateParams(url.toString())
}

export function carSearchUrl(to: string, dateIso?: string) {
  const city = encodeURIComponent(to.trim())
  if (to.trim() && dateIso) {
    return stripAffiliateParams(`https://www.kayak.de/cars/${city}/${dateIso}/${addDays(dateIso, 1)}`)
  }
  return stripAffiliateParams(to.trim() ? `https://www.kayak.de/cars/${city}` : 'https://www.kayak.de/cars')
}

export function packageSearchUrl(from: string, to: string, dateIso?: string, locale: 'de' | 'en' = 'de') {
  const q =
    locale === 'de'
      ? `Pauschalreise ${from.trim() ? `von ${from.trim()} ` : ''}nach ${to.trim()}${dateIso ? ` am ${dateIso}` : ''}`.trim()
      : `Package holiday ${from.trim() ? `from ${from.trim()} ` : ''}to ${to.trim()}${dateIso ? ` on ${dateIso}` : ''}`.trim()
  const hl = locale === 'de' ? 'de' : 'en'
  return stripAffiliateParams(`https://www.google.com/travel/flights?hl=${hl}&q=${encodeURIComponent(q)}`)
}

/** Public search for an old demo offer id. Never a fare Allda received. */
export function offerOutboundHref(
  offer: { kind: TravelLinkKind; from?: string; to: string; dateFrom?: string },
  locale: 'de' | 'en' = 'de',
) {
  const from = offer.from || ''
  const to = offer.to || ''
  const dateIso = offer.dateFrom || ''
  if (offer.kind === 'rail') return bahnSearchUrl(from, to, dateIso)
  if (offer.kind === 'hotel') return hotelSearchUrl(to || from, dateIso)
  if (offer.kind === 'car') return carSearchUrl(to || from, dateIso)
  if (offer.kind === 'package') return packageSearchUrl(from, to || from, dateIso, locale)
  return flightSearchUrl(from, to, dateIso, locale)
}

export function travelSearchLinks(input: {
  from?: string
  to?: string
  dateIso?: string
  locale?: 'de' | 'en'
}): TravelSearchLink[] {
  const from = input.from?.trim() || ''
  const to = input.to?.trim() || ''
  const dateIso = input.dateIso || ''
  const locale = input.locale ?? 'de'
  if (!to && !from) return []
  return [
    {
      kind: 'flight',
      provider: 'Google Flights',
      href: flightSearchUrl(from, to, dateIso, locale),
      mode: 'empty-cta',
    },
    {
      kind: 'hotel',
      provider: 'Booking.com',
      href: hotelSearchUrl(to || from, dateIso),
      mode: 'empty-cta',
    },
    {
      kind: 'car',
      provider: 'Kayak',
      href: carSearchUrl(to || from, dateIso),
      mode: 'empty-cta',
    },
    {
      kind: 'package',
      provider: 'Google Travel',
      href: packageSearchUrl(from, to || from, dateIso, locale),
      mode: 'empty-cta',
    },
  ]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function legName(value: unknown) {
  const rec = asRecord(value)
  const name = rec?.name
  return typeof name === 'string' ? name : ''
}

/** Parse a HAFAS-shaped journeys payload. Prices stay null unless the payload sent one. */
export function parseRailJourneys(payload: unknown): RailJourney[] {
  const root = asRecord(payload)
  const journeys = root?.journeys
  if (!Array.isArray(journeys)) return []
  const out: RailJourney[] = []
  journeys.forEach((raw, index) => {
    const journey = asRecord(raw)
    if (!journey) return
    const legs = Array.isArray(journey.legs) ? journey.legs : []
    const publicLegs = legs.filter((leg) => {
      const rec = asRecord(leg)
      return !!rec && rec.walking !== true
    })
    if (!publicLegs.length) return
    const first = asRecord(publicLegs[0])
    const last = asRecord(publicLegs[publicLegs.length - 1])
    if (!first || !last) return
    const lines = publicLegs
      .map((leg) => {
        const line = asRecord(asRecord(leg)?.line)
        const name = line?.name
        const product = line?.productName
        if (typeof name === 'string' && name) return name
        if (typeof product === 'string' && product) return product
        return ''
      })
      .filter(Boolean)
    const price = asRecord(journey.price)
    const amount = typeof price?.amount === 'number' && Number.isFinite(price.amount) ? price.amount : null
    const departure = (typeof first.departure === 'string' && first.departure) || (typeof first.plannedDeparture === 'string' ? first.plannedDeparture : '')
    const arrival = (typeof last.arrival === 'string' && last.arrival) || (typeof last.plannedArrival === 'string' ? last.plannedArrival : '')
    let durationMin: number | null = null
    if (departure && arrival) {
      const ms = new Date(arrival).getTime() - new Date(departure).getTime()
      if (Number.isFinite(ms) && ms > 0) durationMin = Math.round(ms / 60000)
    }
    out.push({
      id: `rail-${index}-${departure || index}`,
      departure,
      arrival,
      from: legName(first.origin),
      to: legName(last.destination),
      durationMin,
      transfers: Math.max(0, publicLegs.length - 1),
      lines,
      priceEur: amount,
      currency: amount != null && typeof price?.currency === 'string' ? price.currency : amount != null ? 'EUR' : null,
    })
  })
  return out
}

/**
 * No timetable request. The page shows a bahn.de link the user can open.
 * The input is kept so existing callers compile without a network side effect.
 */
export async function searchLiveRail(_input: {
  from: string
  to: string
  dateIso?: string
  results?: number
  signal?: AbortSignal
}): Promise<RailJourney[]> {
  return []
}
