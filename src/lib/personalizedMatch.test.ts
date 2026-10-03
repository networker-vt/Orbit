import { describe, expect, it } from 'vitest'
import { seedListings, seedProfiles } from '../data/seed'
import { defaultPrefs } from './prefs'
import { personalizedKinds, rankPersonalizedMatch } from './personalizedMatch'

describe('personalized Match deck', () => {
  it('stays empty until an occupation preference exists', () => {
    const prefs = { ...defaultPrefs(), completed: true }
    const items = rankPersonalizedMatch({
      listings: seedListings.filter((l) => l.status === 'active'),
      profiles: seedProfiles,
      prefs,
      locale: 'de',
    })
    expect(items).toEqual([])
    expect(personalizedKinds(items)).toEqual([])
  })
})
