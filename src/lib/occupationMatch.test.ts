import { describe, expect, it } from 'vitest'
import { seedListings } from '../data/seed'
import { selectionFromIds } from '../data/occupations.catalog'
import { defaultPrefs } from './prefs'
import { rankPersonalizedMatch } from './personalizedMatch'
import { hasOccupationIntent, listingMatchesOccupationIntent } from './occupationMatch'

describe('occupation prefs stay fail-closed', () => {
  it('does not treat empty prefs as a match', () => {
    const prefs = defaultPrefs()
    expect(hasOccupationIntent(prefs.seeker)).toBe(false)
    const care = seedListings.find((l) => l.id === 'lst-g-care-1')!
    expect(listingMatchesOccupationIntent(care, prefs.seeker)).toBe(false)
  })

  it('lets a care preference change the deck and leave event jobs out', () => {
    const picked = selectionFromIds(['de-nursing'])
    const prefs = {
      ...defaultPrefs(),
      completed: true,
      seeker: {
        ...defaultPrefs().seeker,
        ...picked,
        industries: picked.industries as never,
      },
    }
    const care = seedListings.find((l) => l.id === 'lst-g-care-1')!
    const stage = seedListings.find((l) => l.title.includes('Stagehand'))!
    expect(listingMatchesOccupationIntent(care, prefs.seeker)).toBe(true)
    expect(listingMatchesOccupationIntent(stage, prefs.seeker)).toBe(false)
    const deck = rankPersonalizedMatch({
      listings: seedListings,
      profiles: [],
      prefs,
      locale: 'de',
    })
    expect(deck.length).toBeGreaterThan(0)
    expect(deck.some((item) => item.kind === 'job' && item.listing.id === care.id)).toBe(true)
    expect(deck.some((item) => item.kind !== 'travel' && item.kind !== 'person' && item.listing?.title.includes('Stagehand'))).toBe(
      false,
    )
    expect(deck.every((item) => item.kind === 'job' || item.kind === 'service')).toBe(true)
  })

  it('returns nothing for an unknown free-text preference', () => {
    const prefs = {
      ...defaultPrefs(),
      completed: true,
      seeker: {
        ...defaultPrefs().seeker,
        occupationOther: 'Quantenbäcker',
      },
    }
    expect(
      rankPersonalizedMatch({
        listings: seedListings,
        profiles: [],
        prefs,
        locale: 'de',
      }),
    ).toEqual([])
  })
})
