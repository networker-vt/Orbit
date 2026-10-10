import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { checkDist } from './check-public-bundle.mjs'

test('checkDist allows transport.rest and fictitious demo phones', () => {
  const dir = mkdtempSync(join(tmpdir(), 'orbit-dist-'))
  writeFileSync(
    join(dir, 'app.js'),
    [
      'const u = "https://v6.db.transport.rest/locations"',
      'const hint = "Rail via transport.rest (open data)"',
      'const demo = "+49 221 000000"',
    ].join('\n'),
  )
  assert.deepEqual(checkDist(dir), [])
})

test('checkDist rejects unexpected +49 numbers', () => {
  const dir = mkdtempSync(join(tmpdir(), 'orbit-dist-'))
  writeFileSync(join(dir, 'app.js'), 'call "+49 30 1234567"')
  const errors = checkDist(dir)
  assert.ok(errors.some((e) => e.includes('+49')))
})
