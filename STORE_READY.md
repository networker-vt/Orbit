# Store-Ready — Allda (ehrlich)

**App-Store-Name:** Allda  
**Untertitel:** Alles für deinen Alltag  
**Bundle-ID:** `app.orbit.companion` (unverändert)  
**SKU:** `orbit-companion` (unverändert)  
**Maskottchen in der App:** Orbi

**Kein Store-Upload ist in diesem Repo passiert und wird hier nicht behauptet.**  
PWA ist installierbar. Native App Store / Play-Einreichung braucht **morgen (und danach)** Klicks **vom Operator** in Apple Developer + Play Console. Dieses Dokument ist die Checkliste dafür — keine Fake-Submission.

Privacy-URL (Pflicht für Stores):  
https://networker-vt.github.io/orbit/privacy  
(dieselbe Seite: `/datenschutz`)

Support-URL:  
https://networker-vt.github.io/orbit/support

Impressum (unverändert, Mirco Küßner, Privatperson):  
https://networker-vt.github.io/orbit/impressum

HTTP-Status der Privacy-URL oben (geprüft 2026-10-12): `https://networker-vt.github.io/orbit/privacy/` ist **HTTP 200**. `https://networker-vt.github.io/eventlogistik-event-os/privacy/` ist **HTTP 404** („Site not found“). Ursache und der Fix ohne Deploy aus diesem PR: [`docs/PAGES_BASE.md`](./docs/PAGES_BASE.md). Ohne abschließenden Slash antwortet die funktionierende URL mit 301 auf die Slash-URL.

Live PWA: https://networker-vt.github.io/orbit/  
Pages `base` **muss** `/orbit/` bleiben. Store-Webview braucht `base: /`.

## Was ihr morgen braucht (Operator, nicht das Repo)

Ohne diese Konten kann **niemand** (auch kein Agent) einreichen:

| Store | Konto | Kosten (indikativ) | Nächster Klick |
|-------|--------|--------------------|----------------|
| Apple | [Apple Developer Program](https://developer.apple.com/programs/) + [App Store Connect](https://appstoreconnect.apple.com/) | ~99 USD/Jahr + Identitätsprüfung | Enroll → App anlegen → Bundle-ID `app.orbit.companion` |
| Google | [Play Console](https://play.google.com/console/signup) | ~25 USD einmalig | Noch kein `android/`-Projekt in diesem Repo |

Keine Signing-Keys und keine Distribution-Zertifikate im Repo. `ios/` ist das Capacitor-Xcode-Projekt (TestFlight). `android/` ist **nicht** eingecheckt.

iOS-Schritte: [`docs/TESTFLIGHT.md`](./docs/TESTFLIGHT.md)  
Config: [`capacitor.config.json`](./capacitor.config.json) (`appId`: `app.orbit.companion`, `webDir`: `dist`)

### Capacitor iOS

```bash
npm ci
npm run cap:sync    # CAPACITOR=1, Vite base /, danach cap sync ios
npx cap open ios    # nur macOS
```

GitHub Pages bleibt `npm run build` mit `base: /orbit/`. Kein Play-Scaffold in diesem Stand.

## Jugendschutz / Age rating (Allda Kids in 2.6.0)

In-App: Altersbänder unter13 / 13–15 / 16–17 / 18+. **Eltern-PIN zuerst**, danach Kids-UI. Kids: **0 Credits** (kein Mint/Spend/P2P), Wallet und öffentlicher Chat aus. Kein Adult-SoftPaywall, keine Abflug-Buchung, kein Kabine-Adult-Try-on. Content-Flag `safeForKids`. Campus: 1 Lektion/Tag frei.

**Store-Altersfreigabe — ehrlich:**

- **Apple:** wahrscheinlich **12+** (User-generated listings, Chat für 18+, parental gate). **9+** nur, wenn Kids-Mode + parental features in App Store Connect als „Parental Controls“ deklariert werden und der Reviewer das akzeptiert. Nicht 4+ — Jobs/Minijobs und Credits sind im Adult-Pfad.
- **Google Play:** Zielgruppe **nicht** „nur Kinder“, sonst Families Policy. Mixed audience + parental gate. Content rating questionnaire: user-generated, social (optional), simulated purchases (demo credits — **keine** echten IAP bis Stripe).
- Screenshots: **eine** Kids-Gate-Szene + **eine** Campus-Szene + Adult-Home. Keine irreführenden „made for kids“-Claims.

Das ersetzt **kein** Rechtsgutachten. Operator muss die Fragebögen selbst ausfüllen.

## Screenshots — noch zu machen (Blocker)

Stores akzeptieren keine Platzhalter. Benötigt:

- [ ] iPhone 6.7" (1290×2796): Home (gefülltes „Allda fragen“ + outlined chips, **ohne** Campus/Kids/Rewards), Kids-PIN-Gate, Campus (eine Stufe + „Lektion starten“), Treffer, Wallet mit Demo-Hinweis (Adult)
- [ ] iPhone 6.5" / 5.5" (falls Zielgeräte)
- [ ] iPad 13"
- [ ] Android Phone + 7" + 10" Tablet
- [ ] Feature-Grafik Play (1024×500)
- [ ] `public/screenshots/` sind nur PWA-Optik — Stores wollen echte Device-Shots

## Checkliste vor echter Einreichung

- [x] Impressum / Datenschutz / AGB mit echten Kontaktdaten (natürliche Person, Mirco Küßner)
- [x] Privacy Policy URL öffentlich
- [x] PWA installierbar (Service Worker, Manifest, Icons)
- [x] Allda Kids parental gate + `safeForKids` (2.6.0) — Store-Fragebogen noch offen
- [ ] AGB Marktplatz anwaltlich prüfen
- [ ] Supabase live (Auth + RLS) statt Demo-Store — **nicht** für den ersten TestFlight/Internal-Test zwingend, wohl für Production-Payments
- [ ] Content-Moderation & Melde-Flow
- [ ] Store-Screenshots (siehe oben)
- [ ] Play: Datensicherheit + Zielgruppe
- [ ] Apple: Privacy Nutrition Label + Alter
- [ ] **Apple Developer des Operators** (Play Console erst, wenn Android drankommt)
- [x] Capacitor-iOS-Projekt unter `ios/` — Archivieren und Hochladen macht der Operator (GitHub Actions → iOS TestFlight, siehe `docs/TESTFLIGHT.md`)
- [ ] Keine Fake-„Submitted“-Statusmeldungen

## Was noch nicht Store-fertig ist

- iOS-Scaffold und der TestFlight-Workflow liegen im Repo. Ein signiertes IPA entsteht erst, wenn der Operator den Workflow mit seinen Secrets startet. **Noch nichts eingereicht.**
- Kein Android-Projekt
- Keine Push-Notifications
- Keine echten Zahlungen (Wallet = Demo bis Stripe/PayPal/Banking-KYC)
- Operator ist Privatperson — Store-Publisher-Identität muss zum Impressum passen
- Credits sind **kein** fertiges IAP-Produkt

PWA = heute installierbar. iOS-Shell und der Actions-Upload = `docs/TESTFLIGHT.md`, nur mit Mircos Apple-Account. **Wir haben nichts eingereicht.** Play bleibt offen.
