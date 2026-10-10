# Google Play — Review / Data safety (paste)

Copy into **Play Console → App content** notes when submitting Orbit (`app.orbit.companion`).

---

## English

Orbit is a marketplace companion (jobs, learning, social stubs, travel search links).

**Demo mode:** No real payments, no Play Billing. Wallet and credits are local stubs.

**Sign-in for review:** Auth → confirm 18+ → “Start as demo agency”, or create an account with password on the **Account** tab.

**Security (local demo):** Settings → **Sicherheit** — optional password (on-device PBKDF2), TOTP 2FA (QR + backup codes), **biometric unlock** via Android BiometricPrompt (fingerprint and/or face, depending on device). Prompt strings are German when the device locale is de. Data stays on-device; no backend sync.

**Permissions:** `INTERNET`, `USE_BIOMETRIC` (BiometricPrompt only).

Privacy / support: same URLs as App Store review doc (`docs/APP_STORE_REVIEW.md`).

---

## Deutsch (Kurz)

Demo-Build, kein echtes Geld. Review: 18+ → Demo-Agentur oder Konto mit Passwort. Einstellung → Sicherheit: Passwort, 2FA, **Biometrie** (Fingerabdruck/Gesicht) über System-Dialog — alles lokal. Berechtigung `USE_BIOMETRIC` für BiometricPrompt.
