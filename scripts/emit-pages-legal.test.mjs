import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const STATIC_PATHS = [
  'willkommen',
  'angebot',
  'impressum',
  'privacy',
  'datenschutz',
  'support',
  'agb',
  'ranking',
]

describe('emit-pages-legal', () => {
  it('matches the React routes and writes directory indexes (HTTP 200 deep links)', () => {
    const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
    assert.match(app, /path="willkommen"/)
    assert.match(app, /path="angebot"/)
    assert.match(app, /path="privacy"\s+element=\{<DatenschutzPage/)
    assert.match(app, /path="support"\s+element=\{<SupportPage/)
    assert.match(app, /path="impressum"\s+element=\{<ImpressumPage/)
    assert.match(app, /path="datenschutz"\s+element=\{<DatenschutzPage/)
    assert.match(app, /path="agb"\s+element=\{<AgbPage/)
    assert.match(app, /path="ranking"\s+element=\{<RankingPage/)

    const script = readFileSync(new URL('./emit-pages-legal.sh', import.meta.url), 'utf8')
    for (const path of STATIC_PATHS) assert.match(script, new RegExp(`\\b${path}\\b`))
    assert.match(script, /werkzeuge/)

    const dir = mkdtempSync(join(tmpdir(), 'pages-legal-'))
    const html = '<!doctype html><title>Orbit SPA</title><div id="root"></div>'
    writeFileSync(join(dir, 'index.html'), html)
    try {
      execFileSync('bash', ['scripts/emit-pages-legal.sh', dir], {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
      })
      for (const path of STATIC_PATHS) {
        assert.equal(readFileSync(join(dir, path, 'index.html'), 'utf8'), html)
      }
      assert.equal(readFileSync(join(dir, 'index.html'), 'utf8'), html)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('emits werkzeuge/* indexes when App declares those routes', () => {
    // Script reads src/App.tsx from the repo. If no werkzeuge routes yet, skip content check.
    const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
    const matches = [...app.matchAll(/path="(werkzeuge\/[^"]+)"/g)].map((m) => m[1])
    if (!matches.length) {
      assert.ok(true, 'no werkzeuge routes yet — static paths still covered')
      return
    }
    const dir = mkdtempSync(join(tmpdir(), 'pages-werkzeuge-'))
    const html = '<!doctype html><title>x</title>'
    writeFileSync(join(dir, 'index.html'), html)
    try {
      execFileSync('bash', ['scripts/emit-pages-legal.sh', dir], {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
      })
      for (const path of matches) {
        assert.equal(readFileSync(join(dir, path, 'index.html'), 'utf8'), html)
      }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
