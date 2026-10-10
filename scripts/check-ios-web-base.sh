#!/usr/bin/env bash
# Confirm a Capacitor web build used Vite base /, not the GitHub Pages base.
# Usage: scripts/check-ios-web-base.sh [dist-dir]
set -euo pipefail

dist="${1:-dist}"
index="$dist/index.html"

if [[ ! -f "$index" ]]; then
  echo "::error::Missing $index. Run npm run cap:sync (or npm run build:ios) before this check."
  exit 1
fi

if grep -q '/orbit/' "$index"; then
  echo "::error::$index still contains the GitHub Pages base /orbit/. The iOS shell must be built with CAPACITOR=1 so Vite base is /."
  exit 1
fi

if ! grep -Eq '["'\'']\/assets\/' "$index"; then
  echo "::error::$index has no root-absolute /assets/ URL. Vite base for the iOS shell must be /."
  exit 1
fi

echo "iOS web build uses Vite base /."
