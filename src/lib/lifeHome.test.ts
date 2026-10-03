import { describe, expect, it } from 'vitest'
import { seedListings, seedProfiles } from '../data/seed'
import { LIFE_EXAMPLES, SENTENCE_ONLY, alcoholChoiceBlocked, hasRealLifeChoice, pretendsFulfilled, publicMatchLine, sanitizeLifeExamples, textIsAlcohol } from './lifeHome'
import { defaultPrefs, prefsFromStored } from './prefs'
import { rankPersonalizedMatch } from './personalizedMatch'

function listingFrom(title: string, description: string, extra: Partial<(typeof seedListings)[number]> = {}) {
  const base = seedListings.find((item) => item.status === 'active')!
  return {
    ...base,
    ...extra,
    id: title,
    title,
    description,
    status: 'active' as const,
  }
}

describe('everyday life on the first screen', () => {
  it('starts with three off examples and does not preselect employment types', () => {
    const prefs = defaultPrefs()
    expect([...LIFE_EXAMPLES]).toEqual(['Essen', 'Trinken', 'Freizeit'])
    expect(SENTENCE_ONLY).toEqual(['Fitness', 'Auto', 'Arbeit'])
    expect(LIFE_EXAMPLES).not.toEqual(expect.arrayContaining([...SENTENCE_ONLY]))
    expect(prefs.seeker.lifeExamples).toEqual([])
    expect(prefs.seeker.jobTypes).toEqual([])
    expect(prefs.seeker.jobTypesChosen).toBe(false)
    expect(hasRealLifeChoice(prefs.seeker)).toBe(false)
  })

  it('does not turn examples on from old saved industries or the old job-type default', () => {
    const stored = prefsFromStored(
      JSON.stringify({
        side: 'seeker',
        completed: true,
        seeker: {
          industries: ['Gastronomie / Hotel', 'Event / Veranstaltungstechnik'],
          lifeExamples: ['Fitness', 'Essen'],
          jobTypes: ['Vollzeit', 'Teilzeit', 'Minijob', 'Freelance'],
        },
      }),
    )
    expect(stored.seeker.lifeExamples).toEqual(['Essen'])
    expect(stored.seeker.industries).toEqual(['Gastronomie / Hotel', 'Event / Veranstaltungstechnik'])
    expect(stored.seeker.jobTypes).toEqual([])
    expect(stored.seeker.jobTypesChosen).toBe(false)
    expect(sanitizeLifeExamples(stored.seeker.industries)).toEqual([])
    expect(hasRealLifeChoice({ industries: stored.seeker.industries })).toBe(false)
  })

  it('keeps an employment type only after a real choice', () => {
    const subset = prefsFromStored(
      JSON.stringify({ seeker: { jobTypes: ['Teilzeit'] } }),
    )
    expect(subset.seeker.jobTypes).toEqual(['Teilzeit'])
    expect(subset.seeker.jobTypesChosen).toBe(true)

    const explicit = prefsFromStored(
      JSON.stringify({
        seeker: { jobTypes: ['Vollzeit', 'Teilzeit', 'Minijob', 'Freelance'], jobTypesChosen: true },
      }),
    )
    expect(explicit.seeker.jobTypes).toEqual(['Vollzeit', 'Teilzeit', 'Minijob', 'Freelance'])
  })

  it('accepts any sentence, including Fitness, Auto and Arbeit, without sample people or pretend bookings', () => {
    const sentence = 'Ich biete Fitness und ein Auto, und ich suche Arbeit'
    expect(hasRealLifeChoice({ lifeSentence: sentence })).toBe(true)
    const fitness = listingFrom('Fitnessstudio', 'Training', { city: 'Geheimort-Nord' })
    const car = listingFrom('Auto verkaufen', 'Ein Auto', { city: 'Geheimort-West' })
    const work = listingFrom('Arbeit in der Werkstatt', 'Schicht', { city: 'Geheimort-Ost' })
    const booked = listingFrom('Tisch reserviert', 'bereits gebucht', { tags: ['Essen'], city: 'Geheimort-Sued' })
    const forgotten = listingFrom('Nicht vergessen', 'Eine Notiz', { city: 'Geheimort-Mitte' })
    const prefs = {
      ...defaultPrefs(),
      completed: true,
      seeker: { ...defaultPrefs().seeker, lifeSentence: sentence },
    }
    const deck = rankPersonalizedMatch({
      listings: [fitness, car, work, booked, forgotten, ...seedListings],
      profiles: seedProfiles,
      prefs,
      locale: 'de',
    })
    expect(deck.map((item) => item.kind === 'job' || item.kind === 'service')).not.toContain(false)
    const titles = deck.map((item) => (item.kind === 'job' || item.kind === 'service' ? item.listing.title : ''))
    expect(titles).toEqual(expect.arrayContaining(['Fitnessstudio', 'Auto verkaufen', 'Arbeit in der Werkstatt']))
    expect(titles).not.toContain('Tisch reserviert')
    expect(titles).not.toContain('Nicht vergessen')
    expect(deck.every((item) => item.kind !== 'person' && item.kind !== 'travel')).toBe(true)
    expect(deck.every((item) => !('reason' in item) || !item.reason.includes('Geheimort'))).toBe(true)
    expect(pretendsFulfilled(booked)).toBe(true)
    expect(publicMatchLine('Studio Nord')).toBe('Studio Nord')
    expect(publicMatchLine('Studio Nord')).not.toContain('Geheimort')
  })

  it('keeps alcohol closed until the existing 18+ confirmation', () => {
    expect(textIsAlcohol('ein Bier bitte')).toBe(true)
    expect(alcoholChoiceBlocked({ lifeSentence: 'ein Bier' }, false)).toBe(true)
    expect(alcoholChoiceBlocked({ lifeSentence: 'ein Bier' }, true)).toBe(false)
    expect(alcoholChoiceBlocked({ lifeExamples: ['Trinken'], lifeSentence: 'Bier' }, false)).toBe(false)
    const beer = listingFrom('Bier vom Fass', 'Alkohol', { tags: ['Bier'] })
    const water = listingFrom('Wasser und Kaffee', 'Kaffee, Tee und Wasser')
    const prefs = {
      ...defaultPrefs(),
      seeker: { ...defaultPrefs().seeker, lifeExamples: ['Trinken' as const] },
    }
    const closed = rankPersonalizedMatch({
      listings: [beer, water],
      profiles: seedProfiles,
      prefs,
      adult: false,
    })
    expect(closed.map((item) => (item.kind === 'job' || item.kind === 'service' ? item.listing.title : ''))).toEqual([
      'Wasser und Kaffee',
    ])
    const open = rankPersonalizedMatch({
      listings: [beer],
      profiles: [],
      prefs: {
        ...defaultPrefs(),
        seeker: { ...defaultPrefs().seeker, lifeSentence: 'Bier' },
      },
      adult: true,
    })
    expect(open.map((item) => (item.kind === 'job' || item.kind === 'service' ? item.listing.title : ''))).toContain(
      'Bier vom Fass',
    )
  })

  it('leaves the match list empty when only old industries are saved', () => {
    const prefs = {
      ...defaultPrefs(),
      completed: true,
      seeker: {
        ...defaultPrefs().seeker,
        industries: ['Gastronomie / Hotel' as const],
      },
    }
    expect(
      rankPersonalizedMatch({
        listings: seedListings,
        profiles: seedProfiles,
        prefs,
      }),
    ).toEqual([])
  })
})
