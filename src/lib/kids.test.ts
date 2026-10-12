import { afterEach, describe, expect, it } from 'vitest'
import {
  __resetKidsForTests,
  AGE_BANDS,
  enableKids,
  hasParentalPin,
  isKidsMode,
  isUnder18,
  kidsCreditsFrozen,
  kidsHideAdultTryOn,
  kidsHidePublicChat,
  kidsHideSoftPaywall,
  kidsHideSocialChat,
  kidsHideTravel,
  kidsHideSocialConnects,
  kidsHideWallet,
  kidsMaySeeJobs,
  leaveKidsMode,
  listingIsSafeForKids,
  setAgeBand,
  verifyPin,
} from './kids'

describe('Allda Kids', () => {
  afterEach(() => {
    __resetKidsForTests()
  })

  it('treats under-18 bands as kids mode and 18+ as adult', () => {
    expect(AGE_BANDS).toEqual(['under13', '13-15', '16-17', '18+'])
    expect(isUnder18('under13')).toBe(true)
    expect(isUnder18('13-15')).toBe(true)
    expect(isUnder18('16-17')).toBe(true)
    expect(isUnder18('18+')).toBe(false)
    setAgeBand('under13')
    expect(isKidsMode()).toBe(true)
    expect(kidsMaySeeJobs()).toBe(false)
    expect(kidsHideTravel()).toBe(true) // adult Orbi trip booking stays off
    expect(kidsHideSocialChat()).toBe(true)
    expect(kidsHideAdultTryOn()).toBe(true)
    expect(kidsHideSoftPaywall()).toBe(true)
    expect(kidsHideWallet()).toBe(true)
    expect(kidsHidePublicChat()).toBe(true)
    expect(kidsHideSocialConnects()).toBe(true)
    expect(kidsCreditsFrozen()).toBe(true)
    setAgeBand('13-15')
    expect(kidsMaySeeJobs()).toBe(true)
    setAgeBand('18+')
    expect(isKidsMode()).toBe(false)
    expect(kidsHideTravel()).toBe(false)
    expect(kidsCreditsFrozen()).toBe(false)
  })

  it('requires parental PIN before kid UI and before leaving kids mode (fail-closed)', () => {
    expect(enableKids('18+', '1234')).toBeNull()
    expect(enableKids('under13', '12')).toBeNull()
    expect(hasParentalPin()).toBe(false)
    expect(enableKids('under13', '1234')).not.toBeNull()
    expect(hasParentalPin()).toBe(true)
    expect(isKidsMode()).toBe(true)
    expect(leaveKidsMode()).toBe(false)
    expect(isKidsMode()).toBe(true)
    expect(verifyPin('0000')).toBe(false)
    expect(verifyPin('1234')).toBe(true)
    expect(leaveKidsMode()).toBe(true)
    expect(isKidsMode()).toBe(false)
  })

  it('flags age-safe listings', () => {
    expect(
      listingIsSafeForKids({
        safeForKids: true,
        title: 'Nachhilfe Mathe Klasse 5',
        marketType: 'minijob',
      }),
    ).toBe(true)
    expect(
      listingIsSafeForKids({
        safeForKids: false,
        title: 'Nachtbar 18+',
        marketType: 'job',
      }),
    ).toBe(false)
  })
})
