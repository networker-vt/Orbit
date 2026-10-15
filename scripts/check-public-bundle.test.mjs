import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { checkDist, stripAllowedPhones } from './check-public-bundle.mjs'

test('checkDist allows transport.rest and exact allowlisted demo phones in matching files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'orbit-dist-'))
  writeFileSync(
    join(dir, 'store-abc123.js'),
    [
      'const u = "https://v6.db.transport.rest/locations"',
      'const hint = "Rail via transport.rest (open data)"',
      'const demo = "+49 221 000000"',
      'const demo2 = "+49 221 000001"',
    ].join('\n'),
  )
  writeFileSync(join(dir, 'AngebotPage-xyz.js'), 'const fallback = "+49 000 0000000"')
  assert.deepEqual(checkDist(dir), [])
})

test('checkDist rejects allowlisted phone in the wrong file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'orbit-dist-'))
  writeFileSync(join(dir, 'index-abc.js'), 'const demo = "+49 221 000000"')
  const errors = checkDist(dir)
  assert.ok(errors.some((e) => e.includes('+49')))
})

test('checkDist rejects unexpected +49 numbers', () => {
  const dir = mkdtempSync(join(tmpdir(), 'orbit-dist-'))
  writeFileSync(join(dir, 'app.js'), 'call "+49 30 1234567"')
  const errors = checkDist(dir)
  assert.ok(errors.some((e) => e.includes('+49')))
})

test('stripAllowedPhones only removes exact string for matching basename', () => {
  const kept = stripAllowedPhones('/tmp/index-x.js', 'x +49 221 000000 y')
  assert.equal(kept.includes('+49 221 000000'), true)
  const stripped = stripAllowedPhones('/tmp/store-x.js', 'x +49 221 000000 y')
  assert.equal(stripped.includes('+49 221 000000'), false)
})
