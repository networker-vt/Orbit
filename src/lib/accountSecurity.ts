/**
 * Local account security — password, TOTP 2FA, backup codes, biometric unlock flag.
 * Demo-honest: stored on-device only until a server backend exists.
 */
import {
  hashBackupCode,
  hashPassword,
  isPasswordStrongEnough,
  normalizeBackupCodeInput,
  verifyPassword,
  type PasswordRecord,
} from './passwordCrypto'
import {
  clearBiometricUnlock,
  randomUnlockToken,
  storeBiometricUnlockToken,
} from './biometricUnlock'
import { buildOtpAuthUri, generateTotpSecret, verifyTotpCode } from './totpAuth'

export interface UserSecurityRecord {
  password?: PasswordRecord
  totpSecret?: string
  totpEnabled?: boolean
  backupCodeHashes?: string[]
  biometricEnabled?: boolean
  /** Matches secure enclave token when biometrics enabled. */
  biometricUnlockToken?: string
}

const STORE_KEY = 'orbit_account_security_v1'
const UNLOCK_KEY = 'orbit_app_unlock_v1'
const EVT = 'orbit-security-changed'
const UNLOCK_MS = 30 * 60 * 1000

type SecurityStore = Record<string, UserSecurityRecord>

function loadStore(): SecurityStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as SecurityStore) : {}
  } catch {
    return {}
  }
}

function saveStore(next: SecurityStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

function recordFor(userId: string): UserSecurityRecord {
  const all = loadStore()
  return all[userId] ?? {}
}

function commitUser(userId: string, patch: UserSecurityRecord) {
  const all = loadStore()
  all[userId] = { ...recordFor(userId), ...patch }
  saveStore(all)
}

export function subscribeAccountSecurity(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getUserSecurity(userId: string): UserSecurityRecord {
  return { ...recordFor(userId) }
}

export function hasLocalPassword(userId: string): boolean {
  return Boolean(recordFor(userId).password)
}

export function isTotpEnabled(userId: string): boolean {
  const r = recordFor(userId)
  return Boolean(r.totpEnabled && r.totpSecret)
}

export function isBiometricUnlockEnabled(userId: string): boolean {
  return Boolean(recordFor(userId).biometricEnabled)
}

export async function setUserPassword(userId: string, password: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isPasswordStrongEnough(password)) return { ok: false, reason: 'weak' }
  const passwordRecord = await hashPassword(password)
  commitUser(userId, { password: passwordRecord })
  return { ok: true }
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<{ ok: boolean; reason?: 'weak' | 'wrong' }> {
  const r = recordFor(userId)
  if (!r.password) return { ok: false, reason: 'wrong' }
  if (!(await verifyPassword(currentPassword, r.password))) return { ok: false, reason: 'wrong' }
  if (!isPasswordStrongEnough(nextPassword)) return { ok: false, reason: 'weak' }
  const passwordRecord = await hashPassword(nextPassword)
  commitUser(userId, { password: passwordRecord })
  return { ok: true }
}

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const r = recordFor(userId)
  if (!r.password) return false
  return verifyPassword(password, r.password)
}

export function beginTotpSetup(userId: string, email: string): { secret: string; otpauthUri: string } {
  const secret = generateTotpSecret()
  commitUser(userId, { totpSecret: secret, totpEnabled: false })
  return { secret, otpauthUri: buildOtpAuthUri(email, secret) }
}

export function confirmTotpSetup(userId: string, code: string): { ok: boolean; backupCodes?: string[] } {
  const r = recordFor(userId)
  if (!r.totpSecret) return { ok: false }
  if (!verifyTotpCode(r.totpSecret, code)) return { ok: false }
  const backupCodes = generateBackupCodesPlain()
  const backupCodeHashes = backupCodes.map((c) => hashBackupCode(c))
  commitUser(userId, { totpEnabled: true, backupCodeHashes })
  return { ok: true, backupCodes }
}

export function disableTotp(userId: string) {
  commitUser(userId, {
    totpEnabled: false,
    totpSecret: undefined,
    backupCodeHashes: undefined,
  })
}

export function verifySecondFactor(userId: string, code: string): boolean {
  const r = recordFor(userId)
  const normalized = normalizeBackupCodeInput(code)
  if (/^\d{6}$/.test(normalized) && r.totpSecret && verifyTotpCode(r.totpSecret, normalized)) {
    return true
  }
  const hash = hashBackupCode(normalized)
  const hashes = r.backupCodeHashes ?? []
  const idx = hashes.indexOf(hash)
  if (idx === -1) return false
  const nextHashes = [...hashes]
  nextHashes.splice(idx, 1)
  commitUser(userId, { backupCodeHashes: nextHashes })
  return true
}

function generateBackupCodesPlain(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 8; i += 1) {
    const a = crypto.getRandomValues(new Uint16Array(2))
    codes.push(
      `${a[0]!.toString(16).padStart(4, '0')}-${a[1]!.toString(16).padStart(4, '0')}`.toUpperCase(),
    )
  }
  return codes
}

export async function enableBiometricUnlock(userId: string): Promise<{ ok: boolean; reason?: string }> {
  const token = randomUnlockToken()
  const stored = await storeBiometricUnlockToken(userId, token)
  if (!stored) return { ok: false, reason: 'native' }
  commitUser(userId, { biometricEnabled: true, biometricUnlockToken: token })
  return { ok: true }
}

export async function disableBiometricUnlock(userId: string) {
  await clearBiometricUnlock(userId)
  commitUser(userId, { biometricEnabled: false, biometricUnlockToken: undefined })
}

export function verifyBiometricUnlockToken(userId: string, token: string): boolean {
  const r = recordFor(userId)
  return Boolean(r.biometricEnabled && r.biometricUnlockToken && r.biometricUnlockToken === token)
}

interface UnlockSession {
  userId: string
  until: number
}

function readUnlock(): UnlockSession | null {
  try {
    const raw = sessionStorage.getItem(UNLOCK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UnlockSession
    if (!parsed.userId || typeof parsed.until !== 'number') return null
    if (Date.now() > parsed.until) {
      sessionStorage.removeItem(UNLOCK_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function isAppUnlocked(userId: string): boolean {
  if (!hasLocalPassword(userId)) return true
  const s = readUnlock()
  return s?.userId === userId && Date.now() <= s.until
}

export function markAppUnlocked(userId: string) {
  const next: UnlockSession = { userId, until: Date.now() + UNLOCK_MS }
  sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function clearAppUnlock() {
  sessionStorage.removeItem(UNLOCK_KEY)
  window.dispatchEvent(new CustomEvent(EVT))
}

export function __resetAccountSecurityForTests() {
  localStorage.removeItem(STORE_KEY)
  sessionStorage.removeItem(UNLOCK_KEY)
  window.dispatchEvent(new CustomEvent(EVT))
}
