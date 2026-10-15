import { describe, expect, it } from 'vitest'
import { isOfferDictationOn } from './offerFeatureFlags'

describe('isOfferDictationOn', () => {
  it('defaults to off when env unset', () => {
    expect(isOfferDictationOn()).toBe(false)
  })
})
