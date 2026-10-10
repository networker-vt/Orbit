import { describe, expect, it } from 'vitest'
import { INDUSTRIES } from '../data/industries'
import { seedListings } from '../data/seed'
import { filledIndustries, filledMarketTypes, MAX_LIVE_CATEGORIES } from './categories'

describe('live categories', () => {
  it('hides empty industries and stays within 6–10', () => {
    const live = filledIndustries(seedListings)
    expect(live.length).toBeGreaterThanOrEqual(6)
    expect(live.length).toBeLessThanOrEqual(MAX_LIVE_CATEGORIES)
    expect(live.includes('Gesundheit')).toBe(false)
    expect(live.includes('Produktion')).toBe(false)
    for (const ind of live) {
      expect(INDUSTRIES.includes(ind)).toBe(true)
      expect(seedListings.some((l) => l.industry === ind)).toBe(true)
    }
  })

  it('hides empty marketplace lanes', () => {
    const lanes = filledMarketTypes(seedListings)
    expect(lanes.length).toBeGreaterThan(0)
    expect(lanes.length).toBeLessThanOrEqual(10)
    expect(lanes).toEqual(expect.arrayContaining(['courier', 'ride', 'barter', 'sell', 'minijob']))
  })
})
