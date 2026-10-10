import type { BiometricKind } from './biometricUnlock'

/** i18n key for the primary device-unlock button label. */
export function deviceUnlockButtonKey(kind: BiometricKind, mode: 'native' | 'webauthn' | 'none'): string {
  if (mode === 'webauthn') return 'security.unlockWebAuthn'
  if (kind === 'face') return 'security.unlockFace'
  if (kind === 'fingerprint') return 'security.unlockFinger'
  return 'security.unlockBiometric'
}

/** i18n key for settings hint under Biometrie section. */
export function deviceUnlockHintKey(
  nativeAvailable: boolean,
  webAuthnAvailable: boolean,
  kind: BiometricKind,
): string {
  if (nativeAvailable) {
    if (kind === 'face') return 'security.biometricFaceHint'
    if (kind === 'fingerprint') return 'security.biometricFingerHint'
    if (kind === 'multiple') return 'security.biometricMultipleHint'
    return 'security.biometricGenericHint'
  }
  if (webAuthnAvailable) return 'security.webAuthnHint'
  return 'security.biometricUnavailableHint'
}
