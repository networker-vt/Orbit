# Capacitor — iOS & Android (Allda)

**iOS:** Das Xcode-Projekt liegt unter `ios/`. TestFlight: [`docs/TESTFLIGHT.md`](../docs/TESTFLIGHT.md). Bundle-ID `app.orbit.companion` (Privatperson, keine Firmenbehauptung). `npm run cap:sync` baut mit Vite-Base `/`.

**Android / Play:** kein `android/`-Projekt in diesem Repo. Die Notizen unten sind eine spätere Checkliste, kein Scaffold.

GitHub Pages bleibt `base: /orbit/` (`npm run build`, `npm run deploy:pages`).

**Blocker:** Ohne **Apple Developer**-Account von Mirco Küßner kann niemand nach TestFlight hochladen. Dieses Repo enthält keine Secrets, Zertifikate oder Store-Binaries. Upload ohne Mac: GitHub Actions, siehe [`docs/TESTFLIGHT.md`](../docs/TESTFLIGHT.md).

## 0. Accounts (muss der Operator anlegen)

### Apple (iOS)

1. https://developer.apple.com/programs/ öffnen
2. **Enroll** → Apple-ID von Mirco Küßner (oder später Firma)
3. Zahlung (~99 USD/Jahr) abschließen, Identitätsprüfung
4. Im [App Store Connect](https://appstoreconnect.apple.com/) **Meine Apps → + → Neue App**
5. Bundle-ID `app.orbit.companion` reservieren (exakt wie `capacitor.config.json`)

### Google (Android)

1. https://play.google.com/console/signup
2. Einmalige Registrierung (~25 USD)
3. Entwicklerprofil + D-U-N-S später, falls GmbH
4. **App erstellen** → Name `Allda` → App (nicht nur Spiel)
5. Datenschutz-URL eintragen:  
   `https://networker-vt.github.io/orbit/datenschutz`

## 1. Store-Web-Build (root base)

Im Projektroot, **nicht** den Pages-Base verwenden:

```bash
npm run build:ios
# gleichwertig: CAPACITOR=1 vite build   bzw. VITE_BASE=/ vite build
```

`capacitor.config.json` zeigt auf `webDir: "dist"`. `npm run build` bleibt der Pages-Build.

## 2. iOS-Projekt

`ios/` ist eingecheckt. Web-Assets unter `ios/App/App/public/` erzeugt nur `npm run cap:sync` (nicht committen).

```bash
npm ci
npm run cap:sync
npx cap open ios    # nur macOS
```

Android (`npx cap add android`) ist hier absichtlich nicht ausgeführt.

## 3. Android → Play Console (nächste Klicks)

1. `npx cap open android` (Android Studio)
2. **Build → Generate Signed App Bundle / APK** → Android App Bundle (`.aab`)
3. Keystore **einmal** erzeugen und offline sichern (nicht committen)
4. Play Console → App → **Produktion** oder **Interner Test**
5. **App-Version erstellen** → AAB hochladen
6. Store-Listing: Kurz/Langtext, Grafiken (siehe Checkliste unten)
7. **Datensicherheit**-Formular, Zielgruppe, Inhalt
8. **Zur Prüfung einreichen** — erst möglich nach ausgefülltem Listing + Datenschutz-URL

## 4. iOS → App Store Connect (nächste Klicks)

1. macOS + Xcode (aktuell) + bezahlter Developer-Account
2. `npx cap open ios`
3. Signing & Capabilities: Team = Mircos Apple-Team, Bundle `app.orbit.companion`
4. **Product → Archive** → Organizer → **Distribute App → App Store Connect**
5. App Store Connect → die neue Version wählen → Screenshots, Privacy Nutrition Label
6. Privacy Policy URL: dieselbe wie oben
7. **Zur Prüfung hinzufügen → Einreichen**

PWA allein reicht für den App Store **nicht**.

## 5. Screenshots-Checkliste (Store)

| Slot | Größe (typisch) | Inhalt |
|------|-----------------|--------|
| Phone 6.7" | 1290×2796 | Home + Jobs + Wallet-Hinweis „Demo“ |
| Phone 6.5" | 1284×2778 | Ideen-Box / Empfehlen |
| Phone 5.5" | 1242×2208 | optional |
| Tablet 13" | 2048×2732 | Desktop-Nav + Katalog |
| Android Phone | 1080×1920+ | dieselben Flows |
| Android 7"/10" | Tablet | Marktplatz + Integrationen |

Vorhanden in `public/screenshots/` (PWA): `wide.png`, `narrow.png`. Für Stores **echte Geräte-Screenshots** der Live-Pages-URL nachziehen.

Splash-Assets: `public/icons/splash-1290x2796.png`, `splash-750x1334.png`.

## 6. Privacy / Impressum URLs

- Privacy / Datenschutz: `https://networker-vt.github.io/orbit/privacy` (Alias `/datenschutz`)
- Support: `https://networker-vt.github.io/orbit/support`
- Impressum: `https://networker-vt.github.io/orbit/impressum`
- AGB: `https://networker-vt.github.io/orbit/agb`

Ohne diese URLs lehnen beide Stores die Einreichung ab.

## 7. Was dieses Repo nicht tun kann

- Kein Apple-Login des Operators, keine Zertifikate im Repo
- TestFlight-Upload läuft über GitHub Actions (macOS-Runner), sobald die Secrets aus `docs/TESTFLIGHT.md` gesetzt sind. Ein lokaler Mac ist dafür nicht nötig.
- Kein Play-Store-Projekt
