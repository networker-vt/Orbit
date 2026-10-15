#!/usr/bin/env node
/**
 * Billighandy budgets after `vite build`:
 * - SW precache total ≤ 1.5 MB (home + core; heavy tools are runtime-cached)
 * - entry `index-*.js` ≤ 150 KB gzip
 * - Node polyfills (fs / child_process / tmp) must not appear in browser JS
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
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

/** Precache size from generated service worker manifest. */
const swPath = join(dist, 'sw.js')
if (!existsSync(swPath)) {
  errors.push('bundle limits: dist/sw.js missing')
} else {
  const sw = readFileSync(swPath, 'utf8')
  const urls = [...sw.matchAll(/url:\s*["']([^"']+)["']/g)].map((m) => m[1])
  let total = 0
  const missing = []
  for (const url of urls) {
    const rel = url.replace(/^\//, '').replace(/^orbit\//, '')
    const candidates = [join(dist, rel), join(dist, basename(rel))]
    // url may be "assets/foo.js" relative to scope
    const cleaned = rel.replace(/^.*?(assets\/|icons\/|screenshots\/|index\.html|manifest\.webmanifest|sw\.js|workbox-)/, (_, g) =>
      g.startsWith('assets') || g.startsWith('icons') || g.startsWith('screenshots') ? g : g,
    )
    const pathTry = [
      join(dist, url),
      join(dist, rel),
      join(dist, cleaned),
      join(dist, url.replace(/^\/orbit\//, '')),
    ]
    let found = null
    for (const p of pathTry) {
      if (existsSync(p) && statSync(p).isFile()) {
        found = p
        break
      }
    }
    if (!found) {
      // Workbox sometimes prefixes with base — try assets basename only
      const base = basename(url.split('?')[0])
      const underAssets = join(distAssets, base)
      const underDist = join(dist, base)
      if (existsSync(underAssets)) found = underAssets
      else if (existsSync(underDist)) found = underDist
    }
    if (!found) {
      missing.push(url)
      continue
    }
    total += statSync(found).size
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

for (const file of walkJs(distAssets)) {
  const text = readFileSync(file, 'utf8')
  // Our intentional stubs may still mention the API names in error strings — allow those
  // only inside stubs that Vite inlined. Reject real module import/require forms.
  for (const { id, re } of FORBIDDEN_NODE) {
    if (re.test(text)) {
      errors.push(`${basename(file)} contains Node ${id} import/require`)
    }
  }
}

if (errors.length) fail(errors)
console.log('bundle limits ok')
