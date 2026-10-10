# Orbit

**Dein Orbit — Marktplatz für alles.**

Marketplace for everything (v2.8.1): Reise, Kabine, Lernen, Services, Jobs, B2B und Social. Home leads with Orbi, then a greeting, a compact news strip of real articles, and at most three quiet discover links. Kabine / Gift / Channels stay stubs. **Orbit Kids** and **Campus** live under Mehr.

- **Live (GitHub Pages):** https://networker-vt.github.io/orbit/
- **Repo:** https://github.com/networker-vt/eventlogistik-event-os
- **License:** MIT — forks welcome if they improve Orbit (see [CONTRIBUTING.md](./CONTRIBUTING.md))
- **A11y notes:** [A11Y.md](./A11Y.md) · **2.8.1:** [RELEASE_NOTES_2.8.1.md](./RELEASE_NOTES_2.8.1.md) · **2.8.0:** [RELEASE_NOTES_2.8.0.md](./RELEASE_NOTES_2.8.0.md) · **Credits:** [CREDITS.md](./CREDITS.md)

> Vite `base` **MUST** stay `/orbit/` for GitHub Pages (`npm run build`, `deploy:pages`). Capacitor / TestFlight uses `base: /` via `CAPACITOR=1` (`npm run build:ios`).

## IA (v2.8.1)

**Start · Match · Social · Mein** — four-tab bottom nav. Create in the header (not on Home). Home: Orbi hero above the greeting, one filled **Orbit fragen**, one Tageskarte, then a news strip and at most three quiet discover links (the rest under Mehr). No credit balance on Home. **Mein** is account-only (Wallet adult, Prefs, Verify, Erstellen/Anbieten stubs, Ideen-Box, Channels). Kids: PIN first, 0 Credits, hide Wallet, no social channel connects. Cream base, sparse coral on Home.

## Core routes (v2.8.1)

| Route | Purpose |
|-------|---------|
| `/` | Start — Orbi hero above the greeting, Orbit fragen, one Tageskarte, real news strip, ≤3 discover links. No wallet or credit balance. |
| `/match` | Match — algorithmic deck (travel, kabine, learning, services, jobs, B2B, people) from prefs + behavior stubs |
| `/treffer` | Treffer — swipe offers and requests across the marketplace |
| `/crew` | Crew — B2B partners and offers |
| `/kabine` (`/look`) | Kabine — photo/video try-on (base free) |
| `/social` | Social hub — feed, like, share, vernetzen. Chat at `/social/chat` |
| `/messages` | Redirects to `/social/chat` |
| `/wallet` | Credits (21M cap), gift/sponsoring, methods, bookings, tickets |
| `/abflug` (`/reise`) | Abflug — bahn.de search link; flights/hotels/cars/packages are filled search links. No invented bookings. |
| `/channels` | Opt-in stubs (Meta, X, Steam/PlayStation/Xbox, …) + community link-stubs |
| `/mein` | Account tiles: Wallet (adult), Prefs, Verify, Erstellen/Anbieten stubs, Ideen-Box, Channels |
| `/firma` | Company hub |
| `/marktplatz` | Unified marketplace |
| `/mehr` | Tile grid (Campus, Kids, Abflug, Entdecker Demo, …); Legal |
| `/entdecker` | Camera stub — photo→explain, labeled Demo |
| `/campus` (`/lernen`) | Campus — pick one path, one „Lektion starten“, 1/day free |
| `/kids` | Orbit Kids — parental PIN first, then kid UI; 0 Credits |
| `/impressum` | Mirco Küßner |

Bottom nav: **Start · Match · Social · Mein**

## Honest limits

- **No unofficial scrapes** of LinkedIn / StepStone / Indeed / Xing / etc. Quellen shows status stubs + sample cards tagged with `source`. API/Partner import planned.
- **No real GDS / airline / hotel / rail / car booking.** Travel is mock search + checkout stub. Partner APIs later.
- Orbit Credits: **21M hard cap**, append-only `credit_events` (`txn_id`, balance = sum). Demo = localStorage. Prod (`VITE_APP_MODE=prod` + keys) writes Supabase intents. Pack checkout does not charge anyone. See [CREDITS.md](./CREDITS.md).
- **Orbit Kabine** is filters + labels + seed shops — not live virtual try-on ML.
- **Channel linking** (Amazon, Netflix, YouTube, Spotify, Instagram, Meta, X/Twitter, Steam, PlayStation, Xbox) is a **connected flag only** after explicit Connect + consent. Disconnect clears it. No OAuth, no scraping, no silent harvest. Kids: no social connects.
- **Gift / Sponsoring** (Wallet → Verschenken / Sponsorn) moves demo Credits on this device; 1 Credit fee burned; nobody is paid in fiat. Recipients are listings / companies / profiles in the demo.
- **Social is localStorage-only** — not a full social network.
- Photo “vision” and in-app video calls are **stubs**. Real calling needs a provider (Daily / Twilio / LiveKit) later.
- Matching and mutual chat/booking seeds run locally (localStorage) unless Supabase is configured.
- **Orbit Assist / Orbi** plans locally (heuristics). Trip packages (Köln→Monaco→Landsberg seed) return **2–3 option cards** (Preis / Balance / Schnell). Tap or whitelist voice (`1/2/3`) selects; only **Bestätigen** books a demo stub. No live GDS, no auto-checkout. Optional `VITE_LLM_API_KEY` may add tips; otherwise honest Demo-Recherche.
- **Orbit Kids** is a device-local age band + maths parental gate — not a certified COPPA/KDG implementation. Store age rating still needs the operator questionnaire.

## Quick start

```bash
npm install
cp .env.example .env   # optional — VITE_APP_MODE=demo|prod
npm run dev
```

```bash
npm run build
./scripts/deploy-pages.sh
```

## iOS / TestFlight

Capacitor shell for Apple only (no Play project). Bundle ID `app.orbit.companion`, display name Orbit. `npm run cap:sync` builds with base `/` and copies the web app into `ios/`. Signing and upload: [docs/TESTFLIGHT.md](./docs/TESTFLIGHT.md).

## TestFlight via GitHub Actions

No Mac. After the four repository secrets in [docs/TESTFLIGHT.md](./docs/TESTFLIGHT.md) are set, open **Actions → iOS TestFlight → Run workflow**. The macOS runner runs `npm ci` and `npm run cap:sync` (Vite base `/`), archives the Capacitor app, and uploads an **Internal Testing** build. A tag named `ios-*` (for example `ios-2.9.0`) does the same. The workflow does not deploy GitHub Pages.

Pages stays `npm run build` with base `/orbit/`.

## Open Source

MIT. Fork welcome if it improves Orbit. Keep operator impressum (Mirco Küßner) unless ownership changes.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind 4 · PWA · Capacitor iOS · optional Supabase
