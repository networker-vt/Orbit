import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetAccountSecurityForTests,
  confirmTotpSetup,
  beginTotpSetup,
  hasLocalPassword,
  isTotpEnabled,
  markAppUnlocked,
  isAppUnlocked,
  setUserPassword,
  verifySecondFactor,
  verifyUserPassword,
} from './accountSecurity'
import { currentTotpCode } from './totpAuth'

describe('accountSecurity', () => {
  const userId = 'user-test-sec'

  beforeEach(() => {
    __resetAccountSecurityForTests()
  })

  it('sets and verifies password with PBKDF2 record', async () => {
    expect(await setUserPassword(userId, 'short')).toEqual({ ok: false, reason: 'weak' })
    expect(await setUserPassword(userId, 'long-enough-secret')).toEqual({ ok: true })
    expect(hasLocalPassword(userId)).toBe(true)
    expect(await verifyUserPassword(userId, 'wrong-one-here')).toBe(false)
    expect(await verifyUserPassword(userId, 'long-enough-secret')).toBe(true)
  })

  it('enables TOTP and accepts backup code once', () => {
    const { secret } = beginTotpSetup(userId, 'a@b.invalid')
    const code = currentTotpCode(secret)
    const res = confirmTotpSetup(userId, code)
    expect(res.ok).toBe(true)
    expect(res.backupCodes?.length).toBe(8)
    expect(isTotpEnabled(userId)).toBe(true)
    const backup = res.backupCodes![0]!
    expect(verifySecondFactor(userId, backup)).toBe(true)
    expect(verifySecondFactor(userId, backup)).toBe(false)
  })

  it('tracks app unlock session per user', async () => {
    await setUserPassword(userId, 'session-test-99')
    expect(isAppUnlocked(userId)).toBe(false)
    markAppUnlocked(userId)
    expect(isAppUnlocked(userId)).toBe(true)
  })
})
