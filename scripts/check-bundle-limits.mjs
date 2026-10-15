#!/usr/bin/env node
/**
 * Billighandy budgets after `vite build`:
 * - SW precache total ≤ 1.5 MB (home + core; heavy tools are runtime-cached)
 * - Static imports of every precached JS chunk must also be precached
 * - entry `index-*.js` ≤ 150 KB gzip
 * - Node polyfills (fs / child_process / tmp) must not appear in browser JS
 * - No unresolved bare `import("@pkg")` left in dist (would mean @vite-ignore leak)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const distAssets = join(dist, 'assets')

const PRECACHE_MAX = 1.5 * 1024 * 1024
const INDEX_GZIP_MAX = 150 * 1024
const FORBIDDEN_NODE = [
  { id: 'fs', re: /\bfrom["']fs["']|\brequire\(["']fs["']\)|\bnode:fs\b/ },
  { id: 'child_process', re: /\bfrom["']child_process["']|\brequire\(["']child_process["']\)|\bnode:child_process\b/ },
  { id: 'tmp', re: /\bfrom["']tmp["']|\brequire\(["']tmp["']\)|\bnode:tmp\b/ },
]

function fail(errors) {
  console.error(errors.join('\n'))
  process.exit(1)
}

if (!existsSync(distAssets)) {
  fail(['bundle limits: dist/assets missing — run npm run build first'])
}

const errors = []

function resolvePrecacheUrl(url) {
  const rel = url.replace(/^\//, '').replace(/^orbit\//, '')
  const cleaned = rel.replace(/^.*?(assets\/|icons\/|screenshots\/|index\.html|manifest\.webmanifest|sw\.js|workbox-)/, (_, g) =>
    g.startsWith('assets') || g.startsWith('icons') || g.startsWith('screenshots') ? g : g,
  )
  const pathTry = [
    join(dist, url),
    join(dist, rel),
    join(dist, cleaned),
    join(dist, url.replace(/^\/orbit\//, '')),
  ]
  for (const p of pathTry) {
    if (existsSync(p) && statSync(p).isFile()) return p
  }
  const base = basename(url.split('?')[0])
  const underAssets = join(distAssets, base)
  const underDist = join(dist, base)
  if (existsSync(underAssets)) return underAssets
  if (existsSync(underDist)) return underDist
  return null
}

/** Precache size from generated service worker manifest. */
const swPath = join(dist, 'sw.js')
/** @type {Map<string, string>} basename → absolute path for precached JS */
const precacheJsByBase = new Map()
/** @type {Set<string>} */
const precacheBases = new Set()

if (!existsSync(swPath)) {
  errors.push('bundle limits: dist/sw.js missing')
} else {
  const sw = readFileSync(swPath, 'utf8')
  const urls = [...sw.matchAll(/url:\s*["']([^"']+)["']/g)].map((m) => m[1])
  let total = 0
  const missing = []
  for (const url of urls) {
    const found = resolvePrecacheUrl(url)
    if (!found) {
      missing.push(url)
      continue
    }
    total += statSync(found).size
    const base = basename(found)
    precacheBases.add(base)
    if (base.endsWith('.js')) precacheJsByBase.set(base, found)
  }
  if (missing.length) {
    errors.push(`bundle limits: could not resolve ${missing.length} precache urls (e.g. ${missing[0]})`)
  }
  if (total > PRECACHE_MAX) {
    errors.push(
      `precache ${total} B (${(total / 1024).toFixed(1)} KiB) > ${PRECACHE_MAX} B (1.5 MB)`,
    )
  } else {
    console.log(`precache ok: ${total} B (${(total / 1024).toFixed(1)} KiB) / 1.5 MB`)
  }

  /**
   * Static `from "./chunk.js"` / `import "./chunk.js"` of a precached JS file
   * must themselves be precached (offline shell integrity).
   * Dynamic `import("./…")` is intentional runtime-cache and is ignored.
   */
  const staticFromRe = /\bfrom\s*["'](\.[^"']+\.js)["']/g
  const staticSideRe = /(?:^|[^\w.$])import\s*["'](\.[^"']+\.js)["']/g
  const missingStatic = []
  for (const [base, filePath] of precacheJsByBase) {
    const text = readFileSync(filePath, 'utf8')
    const specs = new Set()
    for (const re of [staticFromRe, staticSideRe]) {
      re.lastIndex = 0
      for (const m of text.matchAll(re)) specs.add(m[1])
    }
    for (const spec of specs) {
      const abs = resolve(dirname(filePath), spec.split('?')[0])
      if (!existsSync(abs) || !statSync(abs).isFile()) continue
      const depBase = basename(abs)
      if (!depBase.endsWith('.js')) continue
      if (!precacheBases.has(depBase)) {
        missingStatic.push(`${base} → ${depBase}`)
      }
    }
  }
  if (missingStatic.length) {
    errors.push(
      `precache incomplete: ${missingStatic.length} static dep(s) of precached chunks not in precache:\n  - ${missingStatic.slice(0, 12).join('\n  - ')}${
        missingStatic.length > 12 ? `\n  … +${missingStatic.length - 12} more` : ''
      }`,
    )
  } else {
    console.log(`precache static deps ok (${precacheJsByBase.size} JS entries)`)
  }
}

/** index chunk gzip budget */
const indexFiles = readdirSync(distAssets).filter((f) => /^index-.*\.js$/.test(f))
if (!indexFiles.length) {
  errors.push('bundle limits: no index-*.js in dist/assets')
} else {
  for (const name of indexFiles) {
    const buf = readFileSync(join(distAssets, name))
    const gz = gzipSync(buf).length
    if (gz > INDEX_GZIP_MAX) {
      errors.push(`${name}: ${gz} B gzip > ${INDEX_GZIP_MAX} B (150 KB)`)
    } else {
      console.log(`index gzip ok: ${name} (${gz} B gzip)`)
    }
  }
}

/** Node polyfills must not enter browser JS */
function walkJs(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) walkJs(path, out)
    else if (name.endsWith('.js')) out.push(path)
  }
  return out
}

/** Bare package dynamic imports that Vite did not rewrite (e.g. leftover @vite-ignore). */
const barePkgImportRe = /\bimport\s*\(\s*["'](@[^"']+)["']\s*\)/g

for (const file of walkJs(distAssets)) {
  const text = readFileSync(file, 'utf8')
  for (const { id, re } of FORBIDDEN_NODE) {
    if (re.test(text)) {
      errors.push(`${basename(file)} contains Node ${id} import/require`)
    }
  }
  for (const m of text.matchAll(barePkgImportRe)) {
    errors.push(`${basename(file)} contains unresolved bare import("${m[1]}")`)
  }
}

if (errors.length) fail(errors)
console.log('bundle limits ok')
