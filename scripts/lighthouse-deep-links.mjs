#!/usr/bin/env node
/**
 * Mobile Lighthouse on deep-link URLs (Slow 4G, 4× CPU). Median of 3 runs.
 * Writes JSON reports under artifacts/lighthouse/ and prints a markdown summary.
 *
 * Usage (after build + emit-pages-legal):
 *   node scripts/lighthouse-deep-links.mjs [baseUrl]
 * Default baseUrl: http://127.0.0.1:4173/orbit/
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'
import { setTimeout as sleep } from 'node:timers/promises'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'artifacts', 'lighthouse')
const PATHS = ['willkommen/', 'angebot/']
const RUNS = 3

function median(nums) {
  const a = [...nums].sort((x, y) => x - y)
  const mid = Math.floor(a.length / 2)
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
    s.on('error', reject)
  })
}

async function waitForUrl(url) {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return
    } catch {
      /* retry */
    }
    await sleep(250)
  }
  throw new Error(`server not ready: ${url}`)
}

function ensureLighthouse() {
  const check = spawnSync('npx', ['--yes', 'lighthouse', '--version'], {
    encoding: 'utf8',
    cwd: root,
  })
  if (check.status !== 0) {
    throw new Error(`lighthouse unavailable: ${check.stderr || check.stdout}`)
  }
}

function runLh(url, reportPath) {
  const args = [
    'lighthouse',
    url,
    '--only-categories=performance,accessibility',
    '--form-factor=mobile',
    '--throttling-method=devtools',
    '--throttling.rttMs=150',
    '--throttling.throughputKbps=1638.4',
    '--throttling.cpuSlowdownMultiplier=4',
    '--chrome-flags=--headless --no-sandbox --disable-gpu',
    '--output=json',
    `--output-path=${reportPath}`,
    '--quiet',
  ]
  const r = spawnSync('npx', ['--yes', ...args], { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) {
    throw new Error(`lighthouse failed for ${url}: ${r.stderr || r.stdout}`)
  }
}

function scoresFrom(reportPath) {
  const j = JSON.parse(readFileSync(reportPath, 'utf8'))
  const perf = Math.round((j.categories?.performance?.score ?? 0) * 100)
  const a11y = Math.round((j.categories?.accessibility?.score ?? 0) * 100)
  const cls = j.audits?.['cumulative-layout-shift']?.numericValue ?? 1
  return { perf, a11y, cls }
}

async function main() {
  ensureLighthouse()
  mkdirSync(outDir, { recursive: true })

  let baseUrl = process.argv[2]
  let preview = null
  if (!baseUrl) {
    if (!existsSync(join(root, 'dist', 'index.html'))) {
      throw new Error('dist/ missing — run npm run build first')
    }
    const port = await freePort()
    baseUrl = `http://127.0.0.1:${port}/orbit/`
    preview = spawn(
      'npx',
      ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
      { stdio: 'ignore', cwd: root },
    )
    await waitForUrl(baseUrl)
  }
  if (!baseUrl.endsWith('/')) baseUrl += '/'

  const sha = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' })
    .stdout.trim()
  const date = new Date().toISOString().slice(0, 10)
  const summary = {
    date,
    sha,
    baseUrl,
    routes: {},
  }

  const gates = { ok: true, notes: [] }

  try {
    for (const path of PATHS) {
      const perfs = []
      const a11ys = []
      const clss = []
      for (let i = 1; i <= RUNS; i++) {
        const reportPath = join(outDir, `${path.replace(/\//g, '_') || 'root'}run${i}.json`)
        const url = `${baseUrl}${path}`
        console.log(`LH ${url} run ${i}/${RUNS}`)
        runLh(url, reportPath)
        const s = scoresFrom(reportPath)
        perfs.push(s.perf)
        a11ys.push(s.a11y)
        clss.push(s.cls)
      }
      const med = {
        perf: median(perfs),
        a11y: median(a11ys),
        cls: median(clss),
        runs: { perfs, a11ys, clss },
      }
      summary.routes[path] = med
      if (med.perf < 90) {
        gates.ok = false
        gates.notes.push(`${path} Perf ${med.perf} < 90`)
      }
      if (med.a11y < 100) {
        gates.ok = false
        gates.notes.push(`${path} A11y ${med.a11y} < 100`)
      }
      if (med.cls >= 0.05) {
        gates.ok = false
        gates.notes.push(`${path} CLS ${med.cls} >= 0.05`)
      }
    }
  } finally {
    if (preview) preview.kill('SIGTERM')
  }

  const mdPath = join(outDir, 'SUMMARY.md')
  const lines = [
    `# Lighthouse deep-links (${date}, SHA ${sha})`,
    '',
    `Base: \`${baseUrl}\``,
    'Mobile · Slow 4G · 4× CPU · median of 3',
    '',
    '| Route | Perf | A11y | CLS |',
    '|---|---:|---:|---:|',
  ]
  for (const [path, med] of Object.entries(summary.routes)) {
    lines.push(`| \`/${path}\` | ${med.perf} | ${med.a11y} | ${med.cls.toFixed(3)} |`)
  }
  lines.push('', `Gates: ${gates.ok ? 'PASS' : 'FAIL'}`)
  if (gates.notes.length) lines.push(...gates.notes.map((n) => `- ${n}`))
  writeFileSync(mdPath, lines.join('\n') + '\n')
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log(lines.join('\n'))
  if (!gates.ok) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
