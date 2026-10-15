#!/usr/bin/env bash
# After `vite build`, copy the SPA shell to directory indexes so deep links
# return HTTP 200 on GitHub Pages. `404.html` remains only as a fallback.
#
# Always: willkommen, angebot, impressum, privacy, datenschutz (+ legal extras).
# Also: every werkzeuge/* segment declared in src/App.tsx (if any).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${1:-$ROOT/dist}"
if [[ "$DIST" != /* ]]; then
  DIST="$ROOT/$DIST"
fi

if [[ ! -f "$DIST/index.html" ]]; then
  echo "emit-pages-legal: missing $DIST/index.html — run npm run build first" >&2
  exit 1
fi

PATHS=(willkommen angebot impressum privacy datenschutz support agb ranking)

# Discover werkzeuge/* routes from App.tsx (path="werkzeuge/..." ).
APP="$ROOT/src/App.tsx"
if [[ -f "$APP" ]]; then
  while IFS= read -r seg; do
    [[ -n "$seg" ]] || continue
    PATHS+=("$seg")
  done < <(grep -oE 'path="werkzeuge/[^"]+"' "$APP" | sed -E 's/^path="//;s/"$//' | sort -u || true)
fi

# De-duplicate while preserving order
declare -A SEEN=()
UNIQUE=()
for seg in "${PATHS[@]}"; do
  if [[ -z "${SEEN[$seg]+x}" ]]; then
    SEEN[$seg]=1
    UNIQUE+=("$seg")
  fi
done

for seg in "${UNIQUE[@]}"; do
  mkdir -p "$DIST/$seg"
  cp "$DIST/index.html" "$DIST/$seg/index.html"
done

echo "emit-pages-legal: ${UNIQUE[*]}"
