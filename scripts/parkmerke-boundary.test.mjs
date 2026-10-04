import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function read(file) {
  return readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
}

const banned =
  /reservier|gebucht|\bbuchen\b|bezahl|kennzeichen|nummernschild|stripe|paypal|nominatim|requestPermission|watchPosition|supabase|sendBeacon/i

test('Parkmerke copy and modules stay local and out of the eager graph', () => {
  const store = read('src/lib/parkmerkeStore.ts')
  const intent = read('src/lib/parkmerkeIntent.ts')
  const page = read('src/pages/ParkmerkePage.tsx')
  const tiles = read('src/lib/parkmerkeTiles.ts')
  const rules = read('src/lib/parkmerke.ts')
  const home = read('src/pages/HomePage.tsx')
  const mehr = read('src/pages/MehrPage.tsx')
  const app = read('src/App.tsx')
  const main = read('src/main.tsx')

  for (const text of [store, intent, page, tiles, rules, mehr]) {
    assert.doesNotMatch(text, banned)
  }
  assert.doesNotMatch(store, /\bfetch\s*\(/)
  assert.doesNotMatch(intent, /\bfetch\s*\(|indexedDB|setInterval|geolocation/)
  assert.doesNotMatch(page, /\bfetch\s*\(/)
  assert.doesNotMatch(rules, /\bfetch\s*\(|indexedDB/)
  assert.match(home, /sentenceOpensParkmerke/)
  assert.doesNotMatch(home, /ParkmerkePage|parkmerkeStore|parkmerkeTiles|lib\/parkmerke'/)
  assert.doesNotMatch(mehr, /ParkmerkePage|parkmerkeStore|parkmerkeTiles/)
  assert.match(app, /import\('\.\/pages\/ParkmerkePage'\)/)
  assert.match(app, /lazy\(/)
  assert.doesNotMatch(app, /parkmerkeStore|parkmerkeTiles|lib\/parkmerke'/)
  assert.doesNotMatch(main, /parkmerke/)
  assert.match(tiles, /credentials: 'omit'/)
})
