/** Web/PWA unlock via platform authenticator (Touch ID, Windows Hello, Android screen lock). */

const RP_NAME = 'Allda'

function rpId(): string {
  return window.location.hostname || 'localhost'
}

function userIdBytes(userId: string): ArrayBuffer {
  const u8 = new TextEncoder().encode(userId)
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer
}

function challengeBytes(): ArrayBuffer {
  const c = crypto.getRandomValues(new Uint8Array(32))
  return c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength) as ArrayBuffer
}

function toB64url(bytes: ArrayBuffer): string {
  const u8 = new Uint8Array(bytes)
  let s = ''
  for (const b of u8) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(b64url: string): ArrayBuffer {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4)
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out.buffer
}

export async function isWebAuthnPlatformAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!window.isSecureContext) return false
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export async function registerWebAuthnUnlock(
  userId: string,
  email: string,
  displayName: string,
): Promise<{ ok: boolean; credentialId?: string }> {
  if (!(await isWebAuthnPlatformAvailable())) return { ok: false }
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: challengeBytes(),
        rp: { name: RP_NAME, id: rpId() },
        user: {
          id: userIdBytes(userId),
          name: email,
          displayName: displayName || email,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null
    if (!cred?.rawId) return { ok: false }
    return { ok: true, credentialId: toB64url(cred.rawId) }
  } catch {
    return { ok: false }
  }
}

export async function unlockWithWebAuthn(credentialIds: string[]): Promise<boolean> {
  if (!credentialIds.length) return false
  if (!(await isWebAuthnPlatformAvailable())) return false
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challengeBytes(),
        rpId: rpId(),
        allowCredentials: credentialIds.map((id) => ({
          type: 'public-key' as const,
          id: fromB64url(id),
        })),
        userVerification: 'required',
        timeout: 60_000,
      },
    })
    return Boolean(assertion)
  } catch {
    return false
  }
}
