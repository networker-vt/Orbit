import { describe, expect, it } from 'vitest'
import { CRAFTS } from './constants'
import {
  OCCUPATION_GROUPS,
  OCCUPATIONS,
  labelsAreEventOnly,
  occupationByLabel,
} from './occupations'

describe('occupation catalog', () => {
  it('keeps event trades and adds every other kind of work', () => {
    for (const craft of CRAFTS) {
      expect(occupationByLabel(craft)?.group).toBe('event')
    }
    expect(labelsAreEventOnly([...CRAFTS])).toBe(true)
    expect(labelsAreEventOnly(OCCUPATIONS.map((job) => job.de))).toBe(false)
    expect(OCCUPATION_GROUPS.length).toBeGreaterThanOrEqual(10)
    expect(OCCUPATIONS.filter((job) => job.group === 'event').length).toBeLessThan(
      OCCUPATIONS.length / 2,
    )
    expect(OCCUPATIONS.some((job) => job.group === 'care' && job.de === 'Pflegefachkraft')).toBe(true)
    expect(OCCUPATIONS.some((job) => job.group === 'tech' && job.en === 'Software developer')).toBe(true)
    expect(OCCUPATIONS.some((job) => job.group === 'teach')).toBe(true)
    expect(OCCUPATIONS.some((job) => job.group === 'food')).toBe(true)
    expect(OCCUPATIONS.some((job) => job.group === 'make')).toBe(true)
    expect(new Set(OCCUPATIONS.map((job) => job.id)).size).toBe(OCCUPATIONS.length)
  })
})
