import { afterEach, describe, expect, it } from 'vitest'
import { FEATURE_FLAG_DEFS, __setFlagForTests, flagReason, isFlagOn } from './flags'

describe('feature flags', () => {
  afterEach(() => {
    __setFlagForTests(null)
  })

  it('keeps risky public surfaces off and publishing on', () => {
    for (const flag of FEATURE_FLAG_DEFS) {
      expect(flag.reason.length).toBeGreaterThan(10)
      expect(isFlagOn(flag.id)).toBe(flag.default)
    }
    expect(isFlagOn('credits')).toBe(false)
    expect(isFlagOn('kids')).toBe(false)
    expect(isFlagOn('channels')).toBe(false)
    expect(isFlagOn('ideas')).toBe(false)
    expect(isFlagOn('integrations')).toBe(false)
    expect(isFlagOn('kabine')).toBe(true)
    expect(isFlagOn('campus')).toBe(false)
    expect(isFlagOn('publishListings')).toBe(true)
  })

  it('can be turned back on in tests without deleting the feature', () => {
    __setFlagForTests('credits', true)
    expect(isFlagOn('credits')).toBe(true)
    expect(flagReason('credits')).toMatch(/ZAG|MiCA/)
  })
})
