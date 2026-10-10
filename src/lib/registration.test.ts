import { beforeEach, describe, expect, it } from 'vitest'
import { __resetKidsForTests } from './kids'
import {
  __resetRegistrationForTests,
  chooseProductMode,
  completeKidsProfile,
  onboardingRedirect,
  recordKidsConsent,
} from './registration'

describe('registration onboarding gate', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetRegistrationForTests()
    __resetKidsForTests()
  })

  it('redirects to chooser when mode unset', () => {
    expect(onboardingRedirect('/')).toBe('/willkommen')
    expect(onboardingRedirect('/willkommen')).toBeNull()
  })

  it('hard-gates kids until consent and PIN', () => {
    chooseProductMode('kids')
    expect(onboardingRedirect('/match')).toBe('/willkommen/kids')
    recordKidsConsent('Maria Muster')
    expect(onboardingRedirect('/')).toBe('/willkommen/kids')
    expect(completeKidsProfile('under13', '1234')).toBe(true)
    expect(onboardingRedirect('/')).toBeNull()
  })

  it('gates adult tour until complete', () => {
    chooseProductMode('orbit')
    expect(onboardingRedirect('/')).toBe('/willkommen/orbit')
    expect(onboardingRedirect('/willkommen/orbit')).toBeNull()
  })
})
