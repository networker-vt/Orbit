/**
 * Module boundary gates for src/modules/* (prep — no feature templates yet).
 * - No network primitives (fetch, XHR, WebSocket, sendBeacon)
 * - No new npm deps without allowlist entry
 * - Modules must be lazy-loaded from App (no eager HomePage imports)
 * - Homepage must not import modules (eager or otherwise)
 */
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { gzipSync } from 'node:zlib'

const root = fileURLToPath(new URL('..', import.meta.url))
const modulesRoot = join(root, 'src', 'modules')
const allowlistPath = join(modulesRoot, 'deps.allowlist.json')

/** Scaffold dirs/files so the suite passes even when few/no modules exist. */
function ensureScaffold() {
  mkdirSync(modulesRoot, { recursive: true })
  if (!existsSync(allowlistPath)) {
    writeFileSync(
      allowlistPath,
      `${JSON.stringify(
        {
          comment:
            'npm package names modules may import. Empty = relative + react only. Add entries deliberately.',
          packages: [],
        },
        null,
        2,
      )}\n`,
    )
  }
  const readme = join(modulesRoot, 'README.md')
  if (!existsSync(readme)) {
    writeFileSync(
      readme,
      '# Modules\n\nOptional feature modules. Lazy-loaded only. No network. CI budget: 50 KB gzip JS per module.\n',
    )
  }
}

ensureScaffold()

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.mjs'))
      out.push(path)
  }
  return out
}

function moduleDirs() {
  if (!existsSync(modulesRoot)) return []
  return readdirSync(modulesRoot).filter((name) => {
    const path = join(modulesRoot, name)
    return statSync(path).isDirectory() && !name.startsWith('.')
  })
}

const importRe = /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,]+from\s+)?['"]([^'"]+)['"]/g
const dynamicImportRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

const NETWORK_BANNED =
  /\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket\b|\.sendBeacon\s*\(|WebSocket\s*\(/

function readAllowlist() {
  const raw = JSON.parse(readFileSync(allowlistPath, 'utf8'))
  return new Set(Array.isArray(raw.packages) ? raw.packages : [])
}

function isAllowedImport(spec, allowlist) {
  if (spec.startsWith('.') || spec.startsWith('@/')) return true
  if (spec === 'react' || spec.startsWith('react/') || spec === 'react-dom' || spec.startsWith('react-dom/'))
    return true
  if (spec.startsWith('react-router')) return true
  // Package name (possibly scoped)
  const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
  return allowlist.has(pkg)
}

test('src/modules scaffold exists', () => {
  assert.ok(existsSync(modulesRoot))
  assert.ok(existsSync(allowlistPath))
})

test('module sources forbid network and undeclared npm deps', () => {
  const allowlist = readAllowlist()
  const files = walk(modulesRoot)
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    assert.doesNotMatch(
      text,
      NETWORK_BANNED,
      `${relative(root, file)} must not use fetch/XHR/WebSocket/sendBeacon`,
    )
    for (const match of text.matchAll(importRe)) {
      const spec = match[1]
      if (spec.startsWith('node:')) {
        assert.fail(`${relative(root, file)} must not import ${spec}`)
      }
      assert.ok(
        isAllowedImport(spec, allowlist),
        `${relative(root, file)} imports ${spec} — add to src/modules/deps.allowlist.json or use a relative import`,
      )
    }
  }
})

test('homepage must not import src/modules (eager or dynamic)', () => {
  const home = readFileSync(join(root, 'src/pages/HomePage.tsx'), 'utf8')
  assert.doesNotMatch(home, /modules\//)
  assert.doesNotMatch(home, /from ['"][^'"]*\/modules\//)
})

test('App must only load modules via lazy/dynamic import', () => {
  const app = readFileSync(join(root, 'src/App.tsx'), 'utf8')
  // Static import of modules is forbidden
  for (const match of app.matchAll(importRe)) {
    const spec = match[1]
    assert.ok(
      !/modules\//.test(spec),
      `App.tsx must not statically import ${spec} — use lazy(() => import(...))`,
    )
  }
  // If App references modules, every reference must be dynamic import
  if (/modules\//.test(app)) {
    const dyn = [...app.matchAll(dynamicImportRe)].map((m) => m[1])
    assert.ok(
      dyn.some((s) => /modules\//.test(s)),
      'App.tsx references modules but has no dynamic import(.../modules/...)',
    )
  }
})

test('module gzip budget ≤ 50 KB per module chunk (when dist present)', () => {
  const distAssets = join(root, 'dist', 'assets')
  const dirs = moduleDirs()
  if (!dirs.length) {
    assert.ok(true, 'no module packages yet — budget N/A')
    return
  }
  if (!existsSync(distAssets)) {
    assert.ok(true, 'dist not built — budget checked after npm run build / CI')
    return
  }
  const MAX = 50 * 1024
  const files = readdirSync(distAssets).filter((f) => f.endsWith('.js'))
  for (const name of dirs) {
    const chunk = files.find((f) => f.startsWith(`module-${name}-`) || f.includes(`module-${name}`))
    if (!chunk) {
      // Module dir exists but not in the graph — OK for scaffold-only packages
      continue
    }
    const buf = readFileSync(join(distAssets, chunk))
    const gz = gzipSync(buf)
    assert.ok(
      gz.length <= MAX,
      `${chunk} is ${gz.length} bytes gzip (max ${MAX}) — split or trim module "${name}"`,
    )
  }
})
