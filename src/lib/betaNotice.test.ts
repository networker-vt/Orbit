import { beforeEach, describe, expect, it } from 'vitest'
import { __setAppModeForTests } from './flags'
import {
  __resetBetaNoticeForTests,
  dismissBetaBannerForSession,
  isBetaNoticeEnabled,
  setBetaNoticeEnabled,
  shouldShowBetaBanner,
} from './betaNotice'

describe('betaNotice', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    __resetBetaNoticeForTests()
    __setAppModeForTests('demo')
  })

  it('shows banner in demo until session dismiss or pref off', () => {
    expect(shouldShowBetaBanner()).toBe(true)
    dismissBetaBannerForSession()
    expect(shouldShowBetaBanner()).toBe(false)
    setBetaNoticeEnabled(false)
    sessionStorage.clear()
    expect(shouldShowBetaBanner()).toBe(false)
    setBetaNoticeEnabled(true)
    expect(isBetaNoticeEnabled()).toBe(true)
    expect(shouldShowBetaBanner()).toBe(true)
  })
})
