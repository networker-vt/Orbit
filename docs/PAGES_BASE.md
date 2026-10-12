# GitHub Pages base: `/orbit/`

Vite `base` for Pages builds is **`/orbit/`** (`vite.config.ts` → `PAGES_BASE`). Leave it there. The repository name is `orbit`. The bundle ID stays `app.orbit.companion`. The SKU stays `orbit-companion`. The app name in the store is Allda.

Share links and `VITE_APP_URL` use `https://networker-vt.github.io/orbit/` (see `.env.production`).

Capacitor / iOS builds use `CAPACITOR=1` → `base: '/'`.

## Why `eventlogistik-event-os/privacy/` is 404

Checked 2026-10-12 with `curl -sI` and the GitHub Pages API.

| URL | Result |
|---|---|
| `https://networker-vt.github.io/eventlogistik-event-os/` | HTTP 404, GitHub page titled “Site not found” |
| `https://networker-vt.github.io/eventlogistik-event-os/privacy/` | HTTP 404, same page (no slash does not redirect) |
| `https://networker-vt.github.io/eventlogistik-event-os/orbit/` | HTTP 404, same page |
| `https://networker-vt.github.io/orbit/` | HTTP 200 |
| `https://networker-vt.github.io/orbit/privacy/` | HTTP 200 |

`GET repos/networker-vt/eventlogistik-event-os` resolves to `networker-vt/orbit`. Pages for that repository:

- source branch `gh-pages`, path `/`
- build type `legacy`
- status `built`
- public URL `https://networker-vt.github.io/orbit/`
- no custom domain

`gh-pages` contains `privacy/index.html` (the SPA shell copied by `scripts/emit-pages-legal.sh` on deploy). The live privacy document is the app shell, and the in-app route `/privacy` renders the Datenschutzerklärung.

The old project path 404s because GitHub Pages uses the **current** repository name. After the rename from `eventlogistik-event-os` to `orbit`, the site moved with the name. GitHub still redirects the git URL `https://github.com/networker-vt/eventlogistik-event-os` to `https://github.com/networker-vt/orbit`. It does not redirect `https://networker-vt.github.io/eventlogistik-event-os/`. The 404 body is GitHub’s generic “Site not found” page, not this app’s `404.html`, so a missing `privacy/index.html` is not the cause.

## Fix

Use this privacy URL in App Store Connect. It already returns HTTP 200. This change does not deploy and does not force-push `gh-pages`.

`https://networker-vt.github.io/orbit/privacy`

Check with the trailing slash (`curl -sI`). Without a slash, Pages returns 301 to the slash URL; `curl -sI -L` ends at 200.

Making `https://networker-vt.github.io/eventlogistik-event-os/privacy/` return 200 would take all three of these, and this pull request does none of them:

1. Rename the repository back to `eventlogistik-event-os` (Settings → General). The repo name stays `orbit`.
2. Set Vite `base` to `/eventlogistik-event-os/` so asset URLs match that path. `base` stays `/orbit/`.
3. Run `npm run deploy:pages` so `gh-pages` is rebuilt, including `privacy/index.html`.
