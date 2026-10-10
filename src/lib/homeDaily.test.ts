import { describe, expect, it } from 'vitest'
import { sortByCheapest } from './tankerkoenig'
import { hungerSearchTerms } from './einkaufszettel'
import { suggestOutfit } from './outfitSuggest'

describe('home daily helpers', () => {
  it('sorts fuel by price', () => {
    const sorted = sortByCheapest(
      [
        {
          id: 'a',
          name: 'A',
          brand: 'X',
          street: '',
          place: '',
          lat: 0,
          lon: 0,
          distKm: 1,
          diesel: 1.9,
          e5: 1.99,
          e10: 1.95,
        },
        {
          id: 'b',
          name: 'B',
          brand: 'Y',
          street: '',
          place: '',
          lat: 0,
          lon: 0,
          distKm: 2,
          diesel: 1.7,
          e5: 1.79,
          e10: 1.75,
        },
      ],
      'e5',
    )
    expect(sorted[0].id).toBe('b')
  })

  it('maps hunger prefs to search terms', () => {
    expect(hungerSearchTerms('heute pasta hunger')).toContain('tomaten')
  })

  it('suggests rain gear when rainy code', () => {
    const s = suggestOutfit(
      { temperatureC: 14, weatherCode: 61, windKmh: 10, fetchedAt: new Date().toISOString() },
      'de',
    )
    expect(s.itemsDe.some((i) => /regen/i.test(i))).toBe(true)
  })
})
