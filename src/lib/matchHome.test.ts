import { describe, expect, it } from 'vitest'
import { seedListings } from '../data/seed'
import { rankForWorld } from './behavior'
import { isSeekerFeedListing } from './market'
import { hasOccupationIntent, listingMatchesOccupationIntent } from './occupationMatch'
import { defaultPrefs } from './prefs'

describe('Prefs → Match stays fail-closed', () => {
  it('does not dump listings when no occupation is chosen', () => {
    const prefs = { ...defaultPrefs(), completed: true }
    const pool = seedListings.filter((l) => isSeekerFeedListing(l) && l.kind === 'offer' && l.status === 'active')
    expect(pool.length).toBeGreaterThan(0)
    expect(hasOccupationIntent(prefs.seeker)).toBe(false)
    const ranked = rankForWorld(pool, prefs).filter((l) => listingMatchesOccupationIntent(l, prefs.seeker))
    expect(ranked).toEqual([])
  })
})
