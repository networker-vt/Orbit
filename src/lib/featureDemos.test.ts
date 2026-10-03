import { describe, expect, it } from 'vitest'
import { isFlagOn } from './flags'
import {
  DEMO_FEATURES,
  demoActionResult,
  demoCopy,
  hiddenPublicFlags,
  isDemoFeature,
  resolveDemoFeature,
} from './featureDemos'

describe('feature demonstrations', () => {
  it('covers every public flag that is off, and leaves publishing alone', () => {
    expect([...hiddenPublicFlags()].sort()).toEqual([...DEMO_FEATURES].sort())
    expect(DEMO_FEATURES).not.toContain('publishListings')
    expect(isFlagOn('publishListings')).toBe(true)
    for (const feature of DEMO_FEATURES) {
      expect(isFlagOn(feature)).toBe(false)
      expect(isDemoFeature(feature)).toBe(true)
    }
    expect(resolveDemoFeature('verify')).toBe('verifyId')
    expect(resolveDemoFeature('verifyId')).toBe('verifyId')
    expect(resolveDemoFeature('publishListings')).toBeUndefined()
  })

  it('says demo in German and English and does not perform the live action', () => {
    expect(demoActionResult()).toBe('blocked')
    for (const feature of DEMO_FEATURES) {
      for (const locale of ['de', 'en'] as const) {
        const copy = demoCopy(feature, locale)
        const blob = `${copy.title} ${copy.lead} ${copy.action} ${copy.samples.join(' ')}`
        expect(blob.toLowerCase()).toMatch(/demo/)
        expect(blob).not.toMatch(/frankfurter\.app|transport\.rest|\+49|21M|IBAN/i)
      }
    }
  })

})
