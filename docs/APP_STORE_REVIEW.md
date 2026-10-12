# App Store Connect — Review Notes (paste)

Copy into **App Review Information → Notes** when submitting Allda (`app.allda.companion`).

---

## English (recommended for Apple)

Allda is a marketplace companion (jobs, learning, social stubs, travel search links).

**Demo mode (default build):** No real money moves. Wallet, credits, packs, and checkout are local stubs — not In-App Purchases and not Stripe/PayPal. Travel opens partner search links only; there is no live GDS booking.

**First launch / registration:** App opens `/willkommen` — choose **Allda (adult)** or **Orbit Kids (up to 18)**. Adults complete a guided tour (prefs, skills, role, demo compliance checklists, profile). Kids require **parental consent** + parent PIN before the Kids hub (`/kids`).

**Sign-in for review (adult path):** Complete the tour or skip to Auth via nav; check “I am at least 18”, then “Start as demo agency” (or Magic Link → “Open demo link”).

**Password / biometrics / 2FA (local demo):** Settings → **Sicherheit** — optional password (PBKDF2 on-device), TOTP authenticator (QR + backup codes), **biometric unlock** in the native app (Face ID / Touch ID on iPhone; fingerprint or face on Android via the same Capacitor plugin — `NSFaceIDUsageDescription` in Info.plist). Web/PWA: password + TOTP; optional browser device lock (WebAuthn) where supported. No server sync. Review: create account with password on **Account**, enable 2FA, sign out, use **Password** tab. Native biometrics need a device build, not Mobile Safari alone.

**Beta banner:** Top strip states the app is in **beta/development** (features may change, errors possible). Links to **Mitentwickeln** (local feedback) and GitHub. Dismiss hides for the session; Einstellungen can re-enable.

**Orbit Kids:** Parental consent gate, then Kids hub (learn, hobbies, nature photo demo, fit quiz). Orbi robot only in Kids. No wallet, no public chat, no adult booking. Not a full marketplace account.

**Open source / feedback:** `/mitentwickeln` — improvement suggestions stored locally; GitHub + CONTRIBUTING linked. **Merges only via maintainer (Haus) after review** — no auto-merge from community PRs.

**Report content:** Use “Report content” on a listing/profile/message. The report is stored on-device; optionally open the mailto to the operator.

**Privacy / Support:**  
https://networker-vt.github.io/orbit/privacy  
https://networker-vt.github.io/orbit/support  

Publisher: Mirco Küßner (private individual) — same as Impressum.

---

## Deutsch (Kurzfassung)

Allda ist ein Marktplatz-Companion. Erststart: Moduswahl Erwachsene vs. Kids (≤18, Einverständnis + PIN). Beta-Hinweis oben. Standard-Build = Demo: kein echtes Geld, keine IAP. Review Erwachsene: Tour oder Auth → 18+ → „Demo als Agentur“. Einstellung → Sicherheit (Passwort, 2FA, Biometrie in der App, WebAuthn im Browser — alles lokal). Android: `docs/PLAY_STORE_REVIEW.md`. Kids-Hub eingeschränkt. Mitentwickeln lokal; Merges nur über Haus. Privacy/Support wie oben.
