# GitHub Pages base: `/orbit/`

Vite `base` for Pages builds is **`/orbit/`** (`vite.config.ts` → `PAGES_BASE`).

Share links and `VITE_APP_URL` should use the public Orbit URL (see `.env.production`).

**Today** (repo still named `eventlogistik-event-os`, Vite `base: '/orbit/'`):

`https://networker-vt.github.io/eventlogistik-event-os/orbit/`

After renaming the repo to `orbit`, the same build layout maps to:

`https://networker-vt.github.io/orbit/`

## Repo name vs URL

GitHub project Pages default URL is `https://<user>.github.io/<repo>/`. If the repository is still named `eventlogistik-event-os`, you need one of:

1. **Rename the repo to `orbit`** so `https://networker-vt.github.io/orbit/` matches `base: '/orbit/'` at site root, or  
2. **Custom domain** for Orbit (recommended long-term), or  
3. **Pages configuration** that serves the built app under `/orbit/` on your chosen host (document the exact public URL in `VITE_APP_URL`).

Capacitor / iOS builds use `CAPACITOR=1` → `base: '/'` (unchanged).
