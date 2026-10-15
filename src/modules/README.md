# Modules

Optional feature modules under `src/modules/<name>/`.

## Rules

- **Lazy-loaded only** — never import into `HomePage` or statically into `App`.
- **No network** — no `fetch`, XHR, `WebSocket`, or `sendBeacon`.
- **npm deps** — only packages listed in `deps.allowlist.json` (plus React / relative imports).
- **CI budget** — max **50 KB gzip** JS per module chunk (`module-<name>-*.js`).

Scaffold only for now; add real modules when needed.
