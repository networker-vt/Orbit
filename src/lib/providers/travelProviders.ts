import type { TravelKind } from '../travel'
import { listDemoTravelCatalog, sortCheapest, type TravelOffer } from '../travel'
import { parseRailJourneys, type RailJourney } from '../travelConnectors'
import { dbTimetableApiKey, dbTimetableApiUrl, travelDemoCatalogEnabled } from './partnerEnv'
import { travelBookingUrl } from './partnerLinks'
import { searchTransportRestJourneys } from './transportRest'

export type TravelProviderSource =
  | 'bahn-deeplink'
  | 'skyscanner-deeplink'
  | 'booking-deeplink'
  | 'transport-rest'
  | 'operator-timetable'
  | 'demo-catalog'

export interface TravelSearchHit {
  id: string
  kind: TravelKind
  title: string
  provider: string
  from?: string
  to: string
  dateFrom?: string
  priceEur: number | null
  duration?: string
  rating?: number
  imageEmoji: string
  tags: string[]
  bookingUrl: string
  source: TravelProviderSource
  mode: 'partner-link' | 'live' | 'demo'
  cheapest?: boolean
}

export interface TravelProviderSearchInput {
  kind?: TravelKind | 'all'
  from?: string
  to?: string
  dateIso?: string
  q?: string
  locale?: 'de' | 'en'
  deepScan?: boolean
  signal?: AbortSignal
}

const PRIMARY_KINDS: TravelKind[] = ['rail', 'flight', 'hotel']

function kindMeta(kind: TravelKind, locale: 'de' | 'en') {
  const de: Record<TravelKind, string> = {
    rail: 'Zug',
    flight: 'Flug',
    hotel: 'Hotel',
    car: 'Mietwagen',
    package: 'Pauschal',
  }
  const en: Record<TravelKind, string> = {
    rail: 'Train',
    flight: 'Flight',
    hotel: 'Hotel',
    car: 'Car',
    package: 'Package',
  }
  return locale === 'de' ? de[kind] : en[kind]
}

function sourceForKind(kind: TravelKind): TravelProviderSource {
  if (kind === 'rail') return 'bahn-deeplink'
  if (kind === 'hotel') return 'booking-deeplink'
  return 'skyscanner-deeplink'
}

function partnerLabel(kind: TravelKind, locale: 'de' | 'en'): string {
  if (kind === 'rail') return locale === 'de' ? 'bahn.de' : 'bahn.de'
  if (kind === 'hotel') return 'Booking.com'
  return 'Skyscanner'
}

export function buildPartnerTravelHits(input: TravelProviderSearchInput): TravelSearchHit[] {
  const locale = input.locale ?? 'de'
  const from = input.from?.trim() || ''
  const to = input.to?.trim() || ''
  if (!from || !to) return []
  const want = input.kind === 'all' || !input.kind ? PRIMARY_KINDS : [input.kind]
  return want.map((kind) => ({
    id: `partner-${kind}-${from}-${to}-${input.dateIso || 'any'}`,
    kind,
    title: `${kindMeta(kind, locale)} · ${from} → ${to}`,
    provider: partnerLabel(kind, locale),
    from,
    to,
    dateFrom: input.dateIso,
    priceEur: null,
    imageEmoji: kind === 'rail' ? '🚆' : kind === 'flight' ? '✈️' : kind === 'hotel' ? '🏨' : kind === 'car' ? '🚗' : '🎒',
    tags: [locale === 'de' ? 'Live-Suche beim Partner' : 'Live search on partner'],
    bookingUrl: travelBookingUrl(kind, { from, to, dateIso: input.dateIso }, locale),
    source: sourceForKind(kind),
    mode: 'partner-link',
  }))
}

function railJourneyToHit(j: RailJourney, input: TravelProviderSearchInput, source: TravelProviderSource): TravelSearchHit {
  const locale = input.locale ?? 'de'
  const from = j.from || input.from || ''
  const to = j.to || input.to || ''
  const dep = j.departure ? new Date(j.departure) : null
  const arr = j.arrival ? new Date(j.arrival) : null
  const time =
    dep && arr && !Number.isNaN(dep.getTime()) && !Number.isNaN(arr.getTime())
      ? `${dep.toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' })} → ${arr.toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}`
      : from && to
        ? `${from} → ${to}`
        : kindMeta('rail', locale)
  return {
    id: j.id,
    kind: 'rail',
    title: time,
    provider: source === 'transport-rest' ? 'transport.rest · DB' : locale === 'de' ? 'Fahrplan (Live)' : 'Timetable (live)',
    from,
    to,
    dateFrom: input.dateIso,
    priceEur: j.priceEur,
    duration: j.durationMin != null ? `${j.durationMin} min` : undefined,
    imageEmoji: '🚆',
    tags: j.lines.length ? j.lines : [`${j.transfers} ${locale === 'de' ? 'Umstiege' : 'changes'}`],
    bookingUrl: travelBookingUrl('rail', { from, to, dateIso: input.dateIso }, locale),
    source,
    mode: 'live',
  }
}

async function searchOperatorRail(input: TravelProviderSearchInput): Promise<TravelSearchHit[]> {
  const base = dbTimetableApiUrl()
  if (!base || !input.from?.trim() || !input.to?.trim()) return []
  const url = new URL(base)
  url.searchParams.set('from', input.from.trim())
  url.searchParams.set('to', input.to.trim())
  if (input.dateIso) url.searchParams.set('date', input.dateIso)
  const key = dbTimetableApiKey()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (key) headers.Authorization = `Bearer ${key}`
  const res = await fetch(url.toString(), { headers, signal: input.signal })
  if (!res.ok) return []
  const payload = await res.json()
  return parseRailJourneys(payload).map((j) => railJourneyToHit(j, input, 'operator-timetable'))
}

function demoOfferToHit(offer: TravelOffer, input: TravelProviderSearchInput): TravelSearchHit {
  const locale = input.locale ?? 'de'
  return {
    id: offer.id,
    kind: offer.kind,
    title: offer.title,
    provider: offer.provider,
    from: offer.from,
    to: offer.to,
    dateFrom: offer.dateFrom,
    priceEur: offer.priceEur,
    duration: offer.duration,
    rating: offer.rating,
    imageEmoji: offer.imageEmoji,
    tags: [...offer.tags, locale === 'de' ? 'Demo-Katalog' : 'Demo catalog'],
    bookingUrl: travelBookingUrl(
      offer.kind,
      { from: input.from || offer.from, to: input.to || offer.to, dateIso: input.dateIso || offer.dateFrom },
      locale,
    ),
    source: 'demo-catalog',
    mode: 'demo',
  }
}

function filterDemoOffers(input: TravelProviderSearchInput): TravelOffer[] {
  if (!travelDemoCatalogEnabled()) return []
  const kind = input.kind === 'all' || !input.kind ? undefined : input.kind
  const q = (input.q || '').toLowerCase()
  const to = (input.to || '').toLowerCase()
  const from = (input.from || '').toLowerCase()
  return sortCheapest(
    listDemoTravelCatalog().filter((o) => {
      if (kind && o.kind !== kind) return false
      if (to && !o.to.toLowerCase().includes(to) && !o.title.toLowerCase().includes(to)) return false
      if (from && o.from && !o.from.toLowerCase().includes(from) && !o.title.toLowerCase().includes(from)) return false
      if (q) {
        const hay = `${o.title} ${o.provider} ${o.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    }),
  )
}

function markCheapest(hits: TravelSearchHit[]): TravelSearchHit[] {
  const priced = hits.filter((h) => h.priceEur != null)
  const min = priced.length ? Math.min(...priced.map((h) => h.priceEur!)) : null
  return hits.map((h) => ({
    ...h,
    cheapest: h.priceEur != null && min != null && h.priceEur === min,
  }))
}

/** Abflug search: live rail when available, always partner deep-links for booking handoff. */
export async function searchTravelProviders(input: TravelProviderSearchInput): Promise<TravelSearchHit[]> {
  const wantKind = input.kind === 'all' || !input.kind ? undefined : input.kind
  const hits: TravelSearchHit[] = []

  if (!wantKind || wantKind === 'rail') {
    const operator = await searchOperatorRail(input)
    hits.push(...operator)
    if (!operator.length) {
      const rest = await searchTransportRestJourneys({
        from: input.from || '',
        to: input.to || '',
        dateIso: input.dateIso,
        results: input.deepScan ? 8 : 5,
        signal: input.signal,
      })
      hits.push(...rest.map((j) => railJourneyToHit(j, input, 'transport-rest')))
    }
  }

  const partners = buildPartnerTravelHits(input)
  if (wantKind) {
    hits.push(...partners.filter((p) => p.kind === wantKind))
  } else {
    hits.push(...partners)
  }

  if (travelDemoCatalogEnabled()) {
    hits.push(...filterDemoOffers(input).map((o) => demoOfferToHit(o, input)))
  }

  const byKind = new Map<string, TravelSearchHit>()
  for (const h of hits) {
    const key = h.mode === 'live' ? h.id : `${h.kind}-${h.mode}-${h.id}`
    if (!byKind.has(key)) byKind.set(key, h)
  }
  const merged = [...byKind.values()]
  const liveFirst = merged.sort((a, b) => {
    if (a.mode === 'live' && b.mode !== 'live') return -1
    if (b.mode === 'live' && a.mode !== 'live') return 1
    if (a.priceEur != null && b.priceEur == null) return -1
    if (b.priceEur != null && a.priceEur == null) return 1
    if (a.priceEur != null && b.priceEur != null) return a.priceEur - b.priceEur
    return a.title.localeCompare(b.title)
  })
  return markCheapest(liveFirst)
}

export function searchTravelProvidersSync(input: Omit<TravelProviderSearchInput, 'signal'>): TravelSearchHit[] {
  return markCheapest(buildPartnerTravelHits(input))
}
