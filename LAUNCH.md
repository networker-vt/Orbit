# Launch-Checkliste — Allda

Deutsche Go-Live-Checkliste. Haken setzen, bevor Traffic / Presse / Ads.

## 1. Supabase-Projekt

- [ ] Projekt anlegen (EU-Region empfohlen, z. B. `eu-central-1`)
- [ ] SQL aus `supabase/migrations/20260912_init.sql`, `20260916_credit_events.sql` **und** `20260917_apply_credit_intent_allowlist.sql` ausführen
- [ ] Edge Function `credit-intent` deployen; Secret `SUPABASE_SERVICE_ROLE_KEY` nur auf dem Function-Host (nie `VITE_*`)
- [ ] `VITE_APP_MODE=prod` nur mit gültigen Keys — ohne Keys **hard-failen Credit-Mutationen** (kein stilles lokales Mint)
- [ ] RLS Policies reviewen (Starter sind vorhanden)
- [ ] Optional: Seed/Migration für Demo-Daten (nicht die lokalen Seed-IDs)

## 2. Environment-Variablen

Lokal / CI / Hosting:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # nur anon/public key — nie service_role im Frontend
VITE_USE_MOCK=false
VITE_APP_NAME=Allda
VITE_APP_URL=https://networker-vt.github.io/orbit/
```

- [ ] `.env` aus `.env.example` (nie committen)
- [ ] Keys nur über sichere Secrets (GitHub Actions / Host)

Die App fällt ohne gültige Keys beim **Store/Auth** weiterhin auf Demo zurück. **Credit-Mutationen in `VITE_APP_MODE=prod` ohne Keys hard-failen** — kein stilles lokales Mint. Siehe [CREDITS.md](./CREDITS.md).

## 3. Domain & DNS

- [ ] Wunschdomain (eigene Domain, nicht an eine Branche gebunden)
- [ ] DNS: CNAME → `networker-vt.github.io` (oder A/AAAA laut Pages-Doku)
- [ ] GitHub → Settings → Pages → Custom domain + HTTPS erzwingen
- [ ] Nach Domain-Wechsel: Auth Redirects & Manifest/`start_url` prüfen

**Hinweis:** Vite `base` ist für dieses Repo `/orbit/`. Bei Root-Domain-Hosting (`https://app…/`) separat mit `base: '/'` bauen.

## 4. GitHub Pages Deploy

```bash
./scripts/deploy-pages.sh
```

Oder manuell: `npm run build` → `cp dist/index.html dist/404.html` → `bash scripts/emit-pages-legal.sh` → force-push `gh-pages`.

`404.html` lässt GitHub Pages bei unbekannten Pfaden **HTTP 404** antworten (SPA rendert trotzdem). Apple will für Privacy und Support echtes **HTTP 200**. `scripts/emit-pages-legal.sh` legt dafür nach dem Vite-Build Kopien der Shell ab: `dist/privacy/index.html`, `dist/support/index.html`, `dist/impressum/index.html`, `dist/datenschutz/index.html`. `npm run build` und die Pages-Base `/orbit/` bleiben unverändert. Das Skript läuft in `deploy:pages` und `build:zip`.

Prüfung **nach** Merge und Pages-Deploy (dieser Stand deployt Pages nicht selbst):

```bash
curl -sI https://networker-vt.github.io/orbit/privacy/
curl -sI https://networker-vt.github.io/orbit/support/
curl -sI https://networker-vt.github.io/orbit/impressum/
curl -sI https://networker-vt.github.io/orbit/datenschutz/
```

Erwartung: `HTTP/2 200`. Ohne abschließenden Slash antwortet Pages mit `301` auf die Slash-URL; `curl -sI -L` endet bei `200`. In-App-Links (`/privacy`, `/support`, `/impressum`) bleiben Client-Routing.

`https://networker-vt.github.io/eventlogistik-event-os/privacy/` ist HTTP 404 („Site not found“), weil Pages am aktuellen Repo-Namen `orbit` hängt. Fix: [`docs/PAGES_BASE.md`](./docs/PAGES_BASE.md). Nicht deployen, um die alte URL zu erzwingen.

- [ ] https://networker-vt.github.io/orbit/ lädt
- [ ] Deep Links (z. B. `/jobs`) über 404.html SPA-Fallback
- [ ] `/privacy/`, `/support/`, `/impressum/`, `/datenschutz/` nach Deploy HTTP 200
- [ ] PWA installierbar (HTTPS Pflicht)

## 5. Analytics (optional)

- [ ] Privacy-freundliches Tool (Plausible / Matomo) — **nur mit Consent**, wenn Cookies/Tracker
- [ ] Datenschutz-Text aktualisieren

## 6. Moderation & Trust

- [ ] Melde-Button / Support-Mail für Inserate & Profile
- [ ] Prozess für Sperrungen (Policy)
- [ ] Verifizierungs-Workflow: E-Mail → ID → Business (Badges schon im UI)

## 7. Verifizierung (Workflow)

- [ ] E-Mail-Confirm via Supabase Auth
- [ ] Manuelle ID-/Business-Prüfung (Upload + Admin-Queue) — TODO Produkt
- [ ] Badge nur nach Check setzen

## 8. Rechtliches

- [x] `/impressum` — Mirco Küßner, Schlebuscher Weg 8, 51061 Köln (natürliche Person, kein HR)
- [x] `/privacy` und `/datenschutz` — dieselbe Erklärung, Deutsch und Englisch
- [x] `/support` — Kontakt derselben Privatperson, kein Firmen-Support
- [ ] `/agb` — Entwurf liegt, **Marktplatz-AGB vor kommerziellem Betrieb anwaltlich prüfen**
- [x] Links in Footer, Mehr und Impressum verdrahtet

Store-URLs (Pages-Basis `/orbit/`):

- Privacy: https://networker-vt.github.io/orbit/privacy
- Support: https://networker-vt.github.io/orbit/support
- Impressum: https://networker-vt.github.io/orbit/impressum
- [ ] AVV mit Supabase, sobald live

## 9. Go-Live Schritte

1. Supabase + Env setzen, Migration laufen lassen  
2. `npm run build` grün  
3. `./scripts/deploy-pages.sh`  
4. Smoke-Test mobil: Login, Job posten, Bewerbung, Chat, Booking → Completed → Rating  
5. Release-ZIP (GitHub Release) für Offline-Verteilung  
6. Soft-Launch mit Pilotkunden (1–2 Agenturen + Crew)  
7. Feedback → Iteration → öffentlicher Launch  

## 10. Nach dem Launch

- Monitoring (Errors, Uptime)
- Backup-Strategie Supabase
- Content: erste echten Jobs/Angebote (keine leere Marketplace-Optik)
- Roadmap: Payments, Push, Capacitor/TWA (siehe `STORE_READY.md`)

## Zahlungen (bewusst Mock)

- Wallet unter `/wallet` ist **Demo-UX** bis Stripe/PayPal/Banking-Partner + KYC.
- FX-Rechner (EUR/USD/GBP/CHF/USDT) zeigt **indikative** Kurse (Frankfurter.app oder statisch).
- IBAN- und Krypto-Withdraw sind Formular-Stubs. Keine PayPal-/Stripe-/Chain-Calls.
- Ohne Provider-Keys und Live-Schalter darf kein echtes Geld bewegt werden.

## Neue Routen (v1.4)

- `/ideen` — Ideen-Box
- `/integrationen` — ERP/Rental-Connect (Mock)
- `/empfehlen` — Referral + Featured-Credits
- `/wallet` — Payments-Netzwerk (Mock + FX)

## Stores

iOS/TestFlight: `docs/TESTFLIGHT.md` (Bundle `app.orbit.companion`). GitHub Actions **iOS TestFlight** archiviert und lädt nach Internal Testing hoch, ohne lokalen Mac. Siehe auch `STORE_READY.md`. Kein Play-Projekt in diesem Repo. Einreichung nur mit dem Apple-Konto des Operators. Der Pages-Deploy bleibt `deploy:pages`.
