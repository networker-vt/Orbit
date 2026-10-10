/** PBKDF2-SHA256 password records — never store plaintext passwords. */

export interface PasswordRecord {
  v: 1
  saltB64: string
  hashB64: string
  iterations: number
}

const PBKDF2_ITERATIONS = 210_000
const SALT_BYTES = 16
const HASH_BYTES = 32

function b64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromB64(b64str: string): Uint8Array {
  const bin = atob(b64str)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const saltBuf = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8,
  )
  return new Uint8Array(bits)
}

export function isPasswordStrongEnough(password: string): boolean {
  const p = String(password)
  return p.length >= 8 && /\S/.test(p)
}

export async function hashPassword(password: string): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(password, salt, PBKDF2_ITERATIONS)
  return {
    v: 1,
    saltB64: b64(salt),
    hashB64: b64(hash),
    iterations: PBKDF2_ITERATIONS,
  }
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  if (record.v !== 1) return false
  const salt = fromB64(record.saltB64)
  const expected = fromB64(record.hashB64)
  const actual = await derive(password, salt, record.iterations)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i += 1) diff |= actual[i]! ^ expected[i]!
  return diff === 0
}

/** One-way fingerprint for backup codes (not a KDF — short random codes). */
export function hashBackupCode(code: string): string {
  const s = `orbit-backup-v1:${String(code).trim().toUpperCase().replace(/\s+/g, '')}`
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

export function normalizeBackupCodeInput(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}
