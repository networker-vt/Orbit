import { Capacitor } from '@capacitor/core'
import { BiometryType } from '@capgo/capacitor-native-biometric'

const SERVER = 'app.orbit.companion.unlock'

export type BiometricKind = 'face' | 'fingerprint' | 'multiple' | 'none' | 'unknown'

export type NativePlatform = 'ios' | 'android' | 'web'

export interface BiometricPromptLabels {
  reason: string
  title: string
  subtitle: string
  description?: string
  negativeButtonText: string
}

export function nativePlatform(): NativePlatform {
  const p = Capacitor.getPlatform()
  if (p === 'ios' || p === 'android') return p
  return 'web'
}

export function biometricSupportedPlatform(): 'native' | 'web' {
  return Capacitor.isNativePlatform() ? 'native' : 'web'
}

function mapBiometryType(biometryType: BiometryType): BiometricKind {
  if (biometryType === BiometryType.FACE_ID || biometryType === BiometryType.FACE_AUTHENTICATION) {
    return 'face'
  }
  if (
    biometryType === BiometryType.TOUCH_ID ||
    biometryType === BiometryType.FINGERPRINT ||
    biometryType === BiometryType.IRIS_AUTHENTICATION
  ) {
    return 'fingerprint'
  }
  if (biometryType === BiometryType.MULTIPLE) return 'multiple'
  return 'unknown'
}

export async function probeBiometricAvailability(): Promise<{
  available: boolean
  kind: BiometricKind
  platform: NativePlatform
}> {
  const platform = nativePlatform()
  if (platform === 'web') {
    return { available: false, kind: 'none', platform }
  }
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    const res = await NativeBiometric.isAvailable({ useFallback: true, preferMultipleBiometryType: true })
    if (!res.isAvailable) {
      return { available: false, kind: 'none', platform }
    }
    return { available: true, kind: mapBiometryType(res.biometryType), platform }
  } catch {
    return { available: false, kind: 'none', platform }
  }
}

export async function storeBiometricUnlockToken(
  userId: string,
  token: string,
  labels: BiometricPromptLabels,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { NativeBiometric, AccessControl } = await import('@capgo/capacitor-native-biometric')
    await NativeBiometric.setCredentials({
      username: userId,
      password: token,
      server: SERVER,
      accessControl: AccessControl.BIOMETRY_ANY,
      title: labels.title,
      negativeButtonText: labels.negativeButtonText,
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

export async function unlockWithBiometric(
  labels: BiometricPromptLabels,
): Promise<{ ok: boolean; token?: string }> {
  if (!Capacitor.isNativePlatform()) return { ok: false }
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    const creds = await NativeBiometric.getSecureCredentials({
      server: SERVER,
      reason: labels.reason,
      title: labels.title,
      subtitle: labels.subtitle,
      description: labels.description ?? labels.subtitle,
      negativeButtonText: labels.negativeButtonText,
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

export function defaultBiometricPromptLabels(t: (key: string) => string): BiometricPromptLabels {
  return {
    reason: t('security.biometricReason'),
    title: t('security.biometricPromptTitle'),
    subtitle: t('security.biometricPromptSubtitle'),
    description: t('security.biometricPromptSubtitle'),
    negativeButtonText: t('security.biometricPromptCancel'),
  }
}
