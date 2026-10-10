import { describe, expect, it } from 'vitest'
import { buildPartnerTravelHits, searchTravelProvidersSync } from './travelProviders'
import { skyscannerFlightUrl } from './partnerLinks'

describe('travel providers', () => {
  it('builds live partner deep-links for rail, flight, and hotel', () => {
    const hits = buildPartnerTravelHits({
      from: 'Frankfurt',
      to: 'Berlin',
      dateIso: '2026-10-16',
      locale: 'de',
    })
    expect(hits).toHaveLength(3)
    expect(hits.every((h) => h.mode === 'partner-link' && h.priceEur == null)).toBe(true)
    expect(hits.find((h) => h.kind === 'rail')?.bookingUrl).toContain('bahn.de')
    expect(hits.find((h) => h.kind === 'flight')?.bookingUrl).toContain('skyscanner')
    expect(hits.find((h) => h.kind === 'hotel')?.bookingUrl).toContain('booking.com')
  })

  it('uses Skyscanner route URLs with cities', () => {
    const url = skyscannerFlightUrl('Frankfurt', 'Berlin', '2026-10-16', 'de')
    expect(url).toContain('skyscanner.de/transport/flights')
    expect(url).toContain('20261016')
  })

  it('returns no hits without from/to', () => {
    expect(searchTravelProvidersSync({ to: 'Berlin' })).toEqual([])
  })
})
