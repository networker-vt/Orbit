# App Store Connect — Review Notes (paste)

Copy into **App Review Information → Notes** when submitting Orbit (`app.orbit.companion`).

---

## English (recommended for Apple)

Orbit is a marketplace companion (jobs, learning, social stubs, travel search links).

**Demo mode (default build):** No real money moves. Wallet, credits, packs, and checkout are local stubs — not In-App Purchases and not Stripe/PayPal. Travel opens partner search links only; there is no live GDS booking.

**Sign-in for review:** On Auth, check “I am at least 18”, then use “Start as demo agency” (or Magic Link → “Open demo link”).

**Password / biometrics / 2FA (local demo):** Settings → **Sicherheit** — optional password (PBKDF2 on-device), TOTP authenticator (QR + backup codes), **biometric unlock** in the native app (Face ID / Touch ID on iPhone; fingerprint or face on Android via the same Capacitor plugin — `NSFaceIDUsageDescription` in Info.plist). Web/PWA: password + TOTP; optional browser device lock (WebAuthn) where supported. No server sync. Review: create account with password on **Account**, enable 2FA, sign out, use **Password** tab. Native biometrics need a device build, not Mobile Safari alone.

**Orbit Kids (feature flag):** When enabled under Mein → Orbit Kids, a parent sets a 4-digit PIN first. Minors get a restricted UI (Campus/Assist; no wallet, no public chat, no adult booking). Kids is not a full marketplace account.

**Report content:** Use “Report content” on a listing/profile/message. The report is stored on-device; optionally open the mailto to the operator.

**Privacy / Support:**  
https://networker-vt.github.io/eventlogistik-event-os/privacy  
https://networker-vt.github.io/eventlogistik-event-os/support  

Publisher: Mirco Küßner (private individual) — same as Impressum.

---

## Deutsch (Kurzfassung)

Orbit ist ein Marktplatz-Companion. Standard-Build = Demo: kein echtes Geld, keine IAP, Reise nur Suchlinks. Review: 18+ → „Demo als Agentur“. Optional: Einstellung → Sicherheit (Passwort, 2FA, Biometrie in der App, WebAuthn im Browser — alles lokal). Android-Hinweise: `docs/PLAY_STORE_REVIEW.md`. Orbit Kids (falls Flag an): Eltern-PIN. Melden in der App. Privacy/Support wie oben.
