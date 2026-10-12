import { generateSecret, generateSync, generateURI, verifySync } from 'otplib'

const ISSUER = 'Allda'

export function generateTotpSecret(): string {
  return generateSecret()
}

export function buildOtpAuthUri(email: string, secret: string): string {
  return generateURI({
    issuer: ISSUER,
    label: email,
    secret,
  })
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const trimmed = String(code).trim().replace(/\s+/g, '')
  if (!/^\d{6}$/.test(trimmed)) return false
  try {
    return verifySync({ secret, token: trimmed }).valid
  } catch {
    return false
  }
}

export function currentTotpCode(secret: string): string {
  return generateSync({ secret })
}
