#!/usr/bin/env bash
# Build + force-push production dist to gh-pages (GitHub Pages).
# Vite base MUST stay /orbit/ (see docs/PAGES_BASE.md)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> npm ci / install"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> build"
npm run build

echo "==> public bundle check (phones, catalog mail, removed hosts)"
node scripts/check-public-bundle.mjs

echo "==> module gzip budget (≤50 KB per module-* chunk)"
node scripts/check-module-budget.mjs

echo "==> SPA fallback 404.html (deep links like /orbit/angebot load the SPA)"
cp dist/index.html dist/404.html

echo "==> legal URLs as directory indexes (HTTP 200)"
bash scripts/emit-pages-legal.sh dist

BRANCH="gh-pages"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> prepare $BRANCH worktree"
cp -a dist/. "$TMP/"
# Keep a minimal marker for Pages
touch "$TMP/.nojekyll"

# Prefer gh-pages remote branch history reset via orphan commit
git -C "$TMP" init -q
git -C "$TMP" checkout -q -b "$BRANCH"
git -C "$TMP" -c user.name="networker-vt" -c user.email="networker-vt@users.noreply.github.com" add -A
git -C "$TMP" -c user.name="networker-vt" -c user.email="networker-vt@users.noreply.github.com" \
  commit -q -m "deploy: GitHub Pages $(date -u +%Y-%m-%dT%H:%MZ)"

REMOTE="$(git remote get-url origin)"
echo "==> force-push $BRANCH → $REMOTE"
git -C "$TMP" push -f "$REMOTE" "$BRANCH:$BRANCH"

PAGES_URL="https://networker-vt.github.io/orbit/"
echo ""
echo "✅ Pages deployed: $PAGES_URL"
echo "   (Custom domain: set in GitHub → Settings → Pages, then DNS CNAME)"
