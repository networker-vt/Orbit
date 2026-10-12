import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function read(file) {
  return readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
}

const banned =
  /reservier|gebucht|\bbuchen\b|bezahl|kennzeichen|nummernschild|stripe|paypal|nominatim|requestPermission|watchPosition|supabase|sendBeacon/i

const pageBanned =
  /reservier|gebucht|\bbuchen\b|bezahl|nummernschild|stripe|paypal|nominatim|requestPermission|watchPosition|supabase|sendBeacon|Andere Autos|werden nicht gezeigt|Nur auf diesem Gerät gespeichert/i

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
  const privacy = read('src/pages/legal/DatenschutzPage.tsx')

  for (const text of [store, intent, tiles, rules, mehr]) {
    assert.doesNotMatch(text, banned)
  }
  assert.doesNotMatch(page, pageBanned)
  assert.match(page, /Bitte kein fremdes Kennzeichen ins Bild nehmen\./)
  assert.doesNotMatch(page.replace('Bitte kein fremdes Kennzeichen ins Bild nehmen.', ''), /kennzeichen/i)
  assert.match(
    page,
    /Die Kartenbilder lädt dein Browser von der OpenStreetMap Foundation \(Großbritannien\)\. Dabei erhält sie deine IP-Adresse und erkennt den Kartenausschnitt\./,
  )
  assert.match(page, /© OpenStreetMap-Mitwirkende/)
  assert.match(page, /https:\/\/www\.openstreetmap\.org\/copyright/)
  assert.match(page, /referrerPolicy="strict-origin"/)
  assert.match(page, /noticeIsVisible/)
  assert.match(
    privacy,
    /Die Kartenbilder lädt dein Browser von der OpenStreetMap Foundation \(Großbritannien\)\. Dabei erhält sie deine IP-Adresse und erkennt den Kartenausschnitt\./,
  )
  assert.match(
    privacy,
    /Rechtsgrundlage ist Art\. 6 Abs\. 1 lit\. f DSGVO; für Großbritannien besteht ein Angemessenheitsbeschluss der EU-Kommission\./,
  )
  assert.match(privacy, /https:\/\/osmfoundation\.org\/wiki\/Privacy_Policy/)
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
  assert.match(tiles, /referrerPolicy: 'strict-origin'/)
  assert.match(tiles, /cache: 'no-store'/)
  assert.doesNotMatch(tiles, /no-referrer|readParkingTile|writeParkingTile|indexedDB/)
  assert.doesNotMatch(store, /readParkingTile|writeParkingTile|objectStore\('tiles'\)/)
})
