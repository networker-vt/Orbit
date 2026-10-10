import { Capacitor } from '@capacitor/core'
import { BiometryType } from '@capgo/capacitor-native-biometric'

const SERVER = 'app.orbit.companion.unlock'

export type BiometricKind = 'face' | 'fingerprint' | 'none' | 'unknown'

export function biometricSupportedPlatform(): 'native' | 'web' {
  return Capacitor.isNativePlatform() ? 'native' : 'web'
}

export async function probeBiometricAvailability(): Promise<{
  available: boolean
  kind: BiometricKind
  platform: 'native' | 'web'
}> {
  const platform = biometricSupportedPlatform()
  if (platform === 'web') {
    return { available: false, kind: 'none', platform }
  }
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    const res = await NativeBiometric.isAvailable({ useFallback: true })
    if (!res.isAvailable) {
      return { available: false, kind: 'none', platform }
    }
    let kind: BiometricKind = 'unknown'
    if (res.biometryType === BiometryType.FACE_ID || res.biometryType === BiometryType.FACE_AUTHENTICATION) {
      kind = 'face'
    } else if (
      res.biometryType === BiometryType.TOUCH_ID ||
      res.biometryType === BiometryType.FINGERPRINT ||
      res.biometryType === BiometryType.MULTIPLE
    ) {
      kind = 'fingerprint'
    }
    return { available: true, kind, platform }
  } catch {
    return { available: false, kind: 'none', platform }
  }
}

export async function storeBiometricUnlockToken(userId: string, token: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { NativeBiometric, AccessControl } = await import('@capgo/capacitor-native-biometric')
    await NativeBiometric.setCredentials({
      username: userId,
      password: token,
      server: SERVER,
      accessControl: AccessControl.BIOMETRY_ANY,
    })
    return true
  } catch {
    return false
  }
}

export async function clearBiometricUnlock(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    await NativeBiometric.deleteCredentials({ server: SERVER })
  } catch {
    /* ignore */
  }
  void userId
}

export async function unlockWithBiometric(reason: string): Promise<{ ok: boolean; token?: string }> {
  if (!Capacitor.isNativePlatform()) return { ok: false }
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    const creds = await NativeBiometric.getSecureCredentials({
      server: SERVER,
      reason,
      title: 'Orbit',
      subtitle: reason,
    })
    return { ok: true, token: creds.password }
  } catch {
    return { ok: false }
  }
}

export function randomUnlockToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}
