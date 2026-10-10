export type TravelKind = 'flight' | 'hotel' | 'rail' | 'car' | 'package'

export interface TravelOffer {
  id: string
  kind: TravelKind
  title: string
  from?: string
  to: string
  dateFrom: string
  dateTo?: string
  provider: string
  priceEur: number
  duration?: string
  rating?: number
  imageEmoji: string
  tags: string[]
}

export const TRAVEL_KINDS: TravelKind[] = ['flight', 'hotel', 'rail', 'car', 'package']

const OFFERS: TravelOffer[] = [
  {
    id: 'tr-fl-1',
    kind: 'flight',
    title: 'FRA → BER · morning',
    from: 'Frankfurt',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    provider: 'Eurowings (Demo)',
    priceEur: 49,
    duration: '1h 10m',
    rating: 4.1,
    imageEmoji: '✈️',
    tags: ['Direkt', 'Handgepäck'],
  },
  {
    id: 'tr-fl-2',
    kind: 'flight',
    title: 'FRA → BER · evening',
    from: 'Frankfurt',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    provider: 'Lufthansa (Demo)',
    priceEur: 89,
    duration: '1h 15m',
    rating: 4.4,
    imageEmoji: '✈️',
    tags: ['Direkt'],
  },
  {
    id: 'tr-fl-3',
    kind: 'flight',
    title: 'MUC → BER · Friday',
    from: 'München',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    provider: 'easyJet (Demo)',
    priceEur: 39,
    duration: '1h 05m',
    rating: 3.9,
    imageEmoji: '✈️',
    tags: ['Günstigste Spur'],
  },
  {
    id: 'tr-fl-4',
    kind: 'flight',
    title: 'CGN → BER',
    from: 'Köln',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    provider: 'Ryanair (Demo)',
    priceEur: 29,
    duration: '1h 20m',
    rating: 3.6,
    imageEmoji: '✈️',
    tags: ['Low-cost'],
  },
  {
    id: 'tr-ht-1',
    kind: 'hotel',
    title: 'Mitte loft — Berlin',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    dateTo: '2026-10-18',
    provider: 'Orbit Stays (Demo)',
    priceEur: 78,
    duration: '/ Nacht',
    rating: 4.5,
    imageEmoji: '🏨',
    tags: ['Zentrum', 'WLAN'],
  },
  {
    id: 'tr-ht-2',
    kind: 'hotel',
    title: 'Hotel am Messepark — München',
    to: 'München',
    dateFrom: '2026-10-29',
    dateTo: '2026-10-31',
    provider: 'Messepark (Demo)',
    priceEur: 112,
    duration: '/ Nacht',
    rating: 4.3,
    imageEmoji: '🏨',
    tags: ['Messe', 'Crew-freundlich'],
  },
  {
    id: 'tr-ht-3',
    kind: 'hotel',
    title: 'Budget inn — München Ost',
    to: 'München',
    dateFrom: '2026-10-29',
    dateTo: '2026-10-31',
    provider: 'CityNest (Demo)',
    priceEur: 64,
    duration: '/ Nacht',
    rating: 3.8,
    imageEmoji: '🏨',
    tags: ['Günstig'],
  },
  {
    id: 'tr-rl-1',
    kind: 'rail',
    title: 'ICE FRA → BER',
    from: 'Frankfurt',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    provider: 'DB (Demo)',
    priceEur: 42,
    duration: '3h 55m',
    rating: 4.2,
    imageEmoji: '🚆',
    tags: ['Sparpreis'],
  },
  {
    id: 'tr-rl-2',
    kind: 'rail',
    title: 'ICE MUC → BER',
    from: 'München',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    provider: 'DB (Demo)',
    priceEur: 68,
    duration: '4h 10m',
    rating: 4.2,
    imageEmoji: '🚆',
    tags: ['Flex'],
  },
  {
    id: 'tr-car-1',
    kind: 'car',
    title: 'Kompakt — München Flughafen',
    to: 'München',
    dateFrom: '2026-10-29',
    dateTo: '2026-10-31',
    provider: 'Sixt (Demo)',
    priceEur: 38,
    duration: '/ Tag',
    rating: 4.0,
    imageEmoji: '🚗',
    tags: ['Mietwagen'],
  },
  {
    id: 'tr-car-2',
    kind: 'car',
    title: 'Kombi — München Zentrum',
    to: 'München',
    dateFrom: '2026-10-29',
    dateTo: '2026-10-31',
    provider: 'Europcar (Demo)',
    priceEur: 52,
    duration: '/ Tag',
    rating: 4.1,
    imageEmoji: '🚗',
    tags: ['Kofferraum'],
  },
  {
    id: 'tr-pk-1',
    kind: 'package',
    title: 'Berlin weekend — flight + hotel',
    from: 'Frankfurt',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    dateTo: '2026-10-18',
    provider: 'Orbit Packs (Demo)',
    priceEur: 189,
    duration: '2 Nächte',
    rating: 4.3,
    imageEmoji: '🎒',
    tags: ['Package'],
  },
  {
    id: 'tr-pk-2',
    kind: 'package',
    title: 'München 29.10. — hotel + car',
    to: 'München',
    dateFrom: '2026-10-29',
    dateTo: '2026-10-31',
    provider: 'Orbit Packs (Demo)',
    priceEur: 214,
    duration: '2 Nächte',
    rating: 4.4,
    imageEmoji: '🎒',
    tags: ['Hotel+Mietwagen'],
  },
  {
    id: 'tr-fl-muc',
    kind: 'flight',
    title: 'BER → MUC · 29.10.',
    from: 'Berlin',
    to: 'München',
    dateFrom: '2026-10-29',
    provider: 'Eurowings (Demo)',
    priceEur: 54,
    duration: '1h 05m',
    rating: 4.0,
    imageEmoji: '✈️',
    tags: ['Direkt'],
  },
  {
    id: 'tr-ht-ber-cheap',
    kind: 'hotel',
    title: 'Hostel Kreuzberg',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    dateTo: '2026-10-17',
    provider: 'A&O (Demo)',
    priceEur: 29,
    duration: '/ Nacht',
    rating: 3.7,
    imageEmoji: '🏨',
    tags: ['Günstigste Spur'],
  },
]

/**
 * Search and Home no longer surface the stub catalog.
 * A direct checkout id can still resolve so an old demo link stays labeled Demo.
 */
export function listTravelOffers(): TravelOffer[] {
  return []
}

export function getTravelOffer(id: string): TravelOffer | undefined {
  return OFFERS.find((o) => o.id === id) ?? TRAVEL_DEEP_SCAN_OFFERS.find((o) => o.id === id)
}

export function searchTravel(input: {
  kind?: TravelKind | 'all'
  from?: string
  to?: string
  dateIso?: string
  q?: string
}): TravelOffer[] {
  void input
  return []
}

export function sortCheapest(items: TravelOffer[]): TravelOffer[] {
  return [...items].sort((a, b) => a.priceEur - b.priceEur)
}

export function withCheapestFlag(items: TravelOffer[]) {
  const sorted = sortCheapest(items)
  const min = sorted[0]?.priceEur
  return sorted.map((o) => ({ ...o, cheapest: o.priceEur === min }))
}

export const TRAVEL_KIND_META: Record<TravelKind, { emoji: string; de: string; en: string }> = {
  flight: { emoji: '✈️', de: 'Flüge', en: 'Flights' },
  hotel: { emoji: '🏨', de: 'Hotels', en: 'Hotels' },
  rail: { emoji: '🚆', de: 'Bahn', en: 'Rail' },
  car: { emoji: '🚗', de: 'Mietwagen', en: 'Car rental' },
  package: { emoji: '🎒', de: 'Urlaub / Packages', en: 'Holidays / packages' },
}

export function searchTravelForNeed(input: {
  kinds?: TravelKind[]
  to?: string
  from?: string
  dateIso?: string
  q?: string
}): Array<TravelOffer & { cheapest: boolean }> {
  const kinds = input.kinds?.length ? input.kinds : undefined
  let items = searchTravel({
    kind: kinds?.length === 1 ? kinds[0] : 'all',
    to: input.to,
    from: input.from,
    dateIso: input.dateIso,
    q: kinds && kinds.length > 1 ? undefined : input.q,
  })
  if (kinds && kinds.length > 1) {
    items = items.filter((o) => kinds.includes(o.kind) || o.kind === 'package')
    if (kinds.includes('hotel') && kinds.includes('car')) {
      items = [...items.filter((o) => o.kind === 'package'), ...items.filter((o) => o.kind !== 'package')]
    }
  }
  if (!items.length) {
    items = sortCheapest(
      listTravelOffers().filter((o) => {
        if (kinds?.length === 1 && o.kind !== kinds[0] && o.kind !== 'package') return false
        if (!input.to) return true
        const to = input.to.toLowerCase()
        return o.to.toLowerCase() === to || o.title.toLowerCase().includes(to)
      }),
    )
  }
  return withCheapestFlag(items)
}

/** Extra cheapest-first hits unlocked by a Credits travel deep-scan (demo). */
export const TRAVEL_DEEP_SCAN_OFFERS: TravelOffer[] = [
  {
    id: 'tr-scan-fl-1',
    kind: 'flight',
    title: 'HHN → BER · red-eye (Scan)',
    from: 'Frankfurt-Hahn',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    provider: 'Orbit Scan (Demo)',
    priceEur: 19,
    duration: '1h 25m',
    rating: 3.4,
    imageEmoji: '✈️',
    tags: ['Deep-Scan', 'Günstigste Spur'],
  },
  {
    id: 'tr-scan-ht-1',
    kind: 'hotel',
    title: 'Capsule Prenzlauer Berg',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    dateTo: '2026-10-17',
    provider: 'Orbit Scan (Demo)',
    priceEur: 22,
    duration: '/ Nacht',
    rating: 3.9,
    imageEmoji: '🏨',
    tags: ['Deep-Scan', 'Günstig'],
  },
  {
    id: 'tr-scan-rail-1',
    kind: 'rail',
    title: 'Sparpreis Köln → Berlin',
    from: 'Köln',
    to: 'Berlin',
    dateFrom: '2026-10-16',
    provider: 'Orbit Scan · DB (Demo)',
    priceEur: 17,
    duration: '4h 20m',
    rating: 4.0,
    imageEmoji: '🚆',
    tags: ['Deep-Scan', 'Sparpreis'],
  },
]

export function mergeDeepScan(items: TravelOffer[], enabled: boolean): TravelOffer[] {
  if (!enabled) return items
  const extra = TRAVEL_DEEP_SCAN_OFFERS.filter((o) => !items.some((x) => x.id === o.id))
  return sortCheapest([...extra, ...items])
}

/** Optional UI demo catalog (`VITE_TRAVEL_DEMO_CATALOG=1`). Booking still opens partner URLs. */
export function listDemoTravelCatalog(): TravelOffer[] {
  return [...OFFERS, ...TRAVEL_DEEP_SCAN_OFFERS]
}

export const TRAVEL_DISCLAIMER_DE =
  'Zug: Live-Fahrplan über transport.rest (Open Data), wenn erreichbar — sonst bahn.de. Flug/Hotel: Skyscanner & Booking — Buchung beim Partner. Orbit nimmt kein Geld entgegen.'

export const TRAVEL_DISCLAIMER_EN =
  'Rail: live timetable via transport.rest when available — otherwise bahn.de. Flights/hotels: Skyscanner & Booking — you book with the partner. Orbit does not take payment.'
