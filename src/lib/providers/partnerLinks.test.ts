import { describe, expect, it } from 'vitest'
import { arbeitsagenturJobSearchUrl, indeedJobSearchUrl, travelBookingUrl } from './partnerLinks'

describe('partner link composers', () => {
  it('composes bahn, skyscanner, and booking URLs', () => {
    expect(travelBookingUrl('rail', { from: 'Köln Hbf', to: 'Berlin Hbf', dateIso: '2026-10-16' })).toContain(
      'bahn.de',
    )
    expect(travelBookingUrl('flight', { from: 'Frankfurt', to: 'Berlin', dateIso: '2026-10-16' })).toContain(
      'skyscanner',
    )
    expect(travelBookingUrl('hotel', { to: 'Berlin', dateIso: '2026-10-16' })).toContain('booking.com')
  })

  it('composes public job search URLs', () => {
    const aa = arbeitsagenturJobSearchUrl('Gastro', 'Berlin')
    expect(aa).toContain('arbeitsagentur.de')
    expect(aa).toContain('was=Gastro')
    const indeed = indeedJobSearchUrl('Gastro', 'Berlin')
    expect(indeed).toContain('indeed.com')
    expect(indeed).toContain('q=Gastro')
  })
})
