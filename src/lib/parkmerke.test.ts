import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PARK_PRESETS_MIN,
  WARN_BEFORE_MS,
  decideSave,
  endAtFromCustom,
  endAtFromMinutes,
  formatRemaining,
  isOsmTileGet,
  osmTileUrl,
  requestCarriesSpot,
  shouldSendLocalWarning,
  warningPhase,
  type ParkingSpot,
  type SpotDraft,
} from './parkmerke'
import { sentenceOpensParkmerke } from './parkmerkeIntent'
import {
  deleteParkingSpot,
  loadParkingSpot,
  markParkingWarned,
  resetParkmerkeStore,
  saveParkingSpot,
} from './parkmerkeStore'
import { loadMapTile } from './parkmerkeTiles'

const NOW = Date.parse('2026-10-04T12:00:00Z')

function photo(text: string) {
  return new Blob([text], { type: 'image/jpeg' })
}

function draft(partial: Partial<SpotDraft> = {}): SpotDraft {
  return {
    photo: photo('own-car'),
    lat: 52.52,
    lng: 13.405,
    accuracy: 12,
    endsAt: endAtFromMinutes(NOW, 60)!,
    ...partial,
  }
}

describe('parking timer', () => {
  it('accepts 30, 60, 90 and 120 minutes and a later custom end', () => {
    expect(PARK_PRESETS_MIN).toEqual([30, 60, 90, 120])
    expect(endAtFromMinutes(NOW, 30)).toBe(NOW + 30 * 60_000)
    expect(endAtFromMinutes(NOW, 60)).toBe(NOW + 60 * 60_000)
    expect(endAtFromMinutes(NOW, 90)).toBe(NOW + 90 * 60_000)
    expect(endAtFromMinutes(NOW, 120)).toBe(NOW + 120 * 60_000)
    expect(endAtFromMinutes(NOW, 45)).toBeNull()
    expect(formatRemaining(30 * 60_000)).toBe('30:00')
    expect(formatRemaining(90 * 60_000)).toBe('1:30:00')
    expect(formatRemaining(0)).toBe('0:00')
    expect(formatRemaining(-1000)).toBe('0:00')

    const custom = endAtFromCustom('2026-10-04T15:30', NOW)
    expect(custom).toBe(new Date('2026-10-04T15:30').getTime())
    expect(endAtFromCustom('2026-10-04T10:00', NOW)).toBeNull()
    expect(endAtFromCustom('tomorrow', NOW)).toBeNull()
  })

  it('warns on this device only in the last 10 minutes, and only if permission is already granted', () => {
    const ends = NOW + 60 * 60_000
    expect(warningPhase(ends, ends - WARN_BEFORE_MS - 1)).toBe('none')
    expect(warningPhase(ends, ends - WARN_BEFORE_MS)).toBe('soon')
    expect(warningPhase(ends, ends)).toBe('over')
    expect(shouldSendLocalWarning('granted', 'soon', false)).toBe(true)
    expect(shouldSendLocalWarning('granted', 'soon', true)).toBe(false)
    expect(shouldSendLocalWarning('granted', 'none', false)).toBe(false)
    expect(shouldSendLocalWarning('granted', 'over', false)).toBe(false)
    expect(shouldSendLocalWarning('default', 'soon', false)).toBe(false)
    expect(shouldSendLocalWarning('denied', 'soon', false)).toBe(false)
    expect(shouldSendLocalWarning('unsupported', 'soon', false)).toBe(false)
  })
})

describe('a new spot does not replace the old one without confirmation', () => {
  it('keeps the stored spot until confirm is true', () => {
    const current: ParkingSpot = { ...draft(), savedAt: NOW, warned: false }
    const next = draft({ photo: photo('next-car'), lat: 48.137, lng: 11.575, endsAt: endAtFromMinutes(NOW, 30)! })
    expect(decideSave(null, next, false, NOW)).toMatchObject({ action: 'save', replaced: false })
    expect(decideSave(current, next, false, NOW)).toEqual({ action: 'needs-confirm' })
    const replaced = decideSave(current, next, true, NOW)
    expect(replaced.action).toBe('save')
    if (replaced.action !== 'save') return
    expect(replaced.replaced).toBe(true)
    expect(replaced.spot.photo).toBe(next.photo)
    expect(replaced.spot.lat).toBe(48.137)
    expect(replaced.spot.warned).toBe(false)
    expect(current.photo).not.toBe(replaced.spot.photo)
  })

  it('rejects a missing photo, a pin that is not a location, and a past end', () => {
    expect(decideSave(null, draft({ photo: new Blob(['x'], { type: 'text/plain' }) }), true, NOW).action).toBe('reject')
    expect(decideSave(null, draft({ lat: 91 }), true, NOW)).toMatchObject({ action: 'reject', reason: 'pin' })
    expect(decideSave(null, draft({ endsAt: NOW }), true, NOW)).toMatchObject({ action: 'reject', reason: 'time' })
  })
})

describe('the spot stays on the device', () => {
  beforeEach(async () => {
    await resetParkmerkeStore()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await resetParkmerkeStore()
  })

  it('saves, keeps, replaces and deletes without fetch, XHR or sendBeacon', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
    const xhr = vi.spyOn(XMLHttpRequest.prototype, 'open')
    const beacon = vi.fn()
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon })

    const first = await saveParkingSpot(draft({ photo: photo('first-photo') }), false, NOW)
    expect(first.ok).toBe(true)
    const blocked = await saveParkingSpot(draft({ photo: photo('second-photo'), endsAt: endAtFromMinutes(NOW, 30)! }), false, NOW)
    expect(blocked).toEqual({ ok: false, reason: 'confirm' })
    const still = await loadParkingSpot()
    expect(await still?.photo.text()).toBe('first-photo')
    expect(still?.lat).toBe(52.52)
    expect(still?.lng).toBe(13.405)

    const replaced = await saveParkingSpot(
      draft({ photo: photo('second-photo'), lat: 48.137, lng: 11.575, endsAt: endAtFromMinutes(NOW, 30)! }),
      true,
      NOW,
    )
    expect(replaced.ok).toBe(true)
    const next = await loadParkingSpot()
    expect(await next?.photo.text()).toBe('second-photo')
    expect(next?.lat).toBe(48.137)
    expect(await still?.photo.text()).toBe('first-photo')

    await markParkingWarned()
    expect((await loadParkingSpot())?.warned).toBe(true)
    expect(await (await loadParkingSpot())?.photo.text()).toBe('second-photo')

    await deleteParkingSpot()
    expect(await loadParkingSpot()).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhr).not.toHaveBeenCalled()
    expect(beacon).not.toHaveBeenCalled()
  })

  it('loads a map tile only as an OpenStreetMap image GET, and uses the cached image offline', async () => {
    const seen: { url: string; method: string; body: unknown }[] = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      seen.push({ url, method: init?.method ?? 'GET', body: init?.body ?? null })
      return new Response(new Blob(['tile-bytes'], { type: 'image/png' }))
    })
    const ctrl = new AbortController()
    const spot = { lat: 52.52, lng: 13.405, photo: photo('own-car') }
    const first = await loadMapTile(17, 17602, 10745, true, ctrl.signal, true)
    expect(await first?.text()).toBe('tile-bytes')
    expect(seen).toHaveLength(1)
    expect(seen[0]?.method).toBe('GET')
    expect(seen[0]?.body).toBeNull()
    expect(isOsmTileGet(seen[0]?.url ?? '')).toBe(true)
    expect(seen[0]?.url).toBe(osmTileUrl(17, 17602, 10745))
    expect(requestCarriesSpot(seen[0]?.url ?? '', seen[0]?.body, spot)).toBe(false)
    expect(seen[0]?.url).not.toContain('52.52')
    expect(seen[0]?.url).not.toContain('13.405')
    expect(seen[0]?.url).not.toContain('own-car')

    fetchSpy.mockClear()
    const cached = await loadMapTile(17, 17602, 10745, false, ctrl.signal, true)
    expect(await cached?.text()).toBe('tile-bytes')
    expect(fetchSpy).not.toHaveBeenCalled()

    const missing = await loadMapTile(17, 1, 1, false, ctrl.signal, true)
    expect(missing).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('refuses tile URLs that carry a query or another host', () => {
    expect(isOsmTileGet('https://tile.openstreetmap.org/17/1/2.png')).toBe(true)
    expect(isOsmTileGet('https://tile.openstreetmap.org/17/1/2.png?lat=52.52&lng=13.405')).toBe(false)
    expect(isOsmTileGet('https://example.test/17/1/2.png')).toBe(false)
    expect(requestCarriesSpot('https://example.test/upload', photo('own-car'), { lat: 52.52, lng: 13.405 })).toBe(true)
  })
})

describe('Parkmerke stays out of the start screen and the first modules', () => {
  it('opens from a parking sentence and not from Auto, Essen or a concert ticket', () => {
    expect(sentenceOpensParkmerke('Parkmerke')).toBe(true)
    expect(sentenceOpensParkmerke('Ich habe geparkt')).toBe(true)
    expect(sentenceOpensParkmerke('Parkzeit 60 Minuten')).toBe(true)
    expect(sentenceOpensParkmerke('Wo ist der Parkplatz')).toBe(true)
    expect(sentenceOpensParkmerke('Ich will parken')).toBe(true)
    expect(sentenceOpensParkmerke('Ich biete Fitness und ein Auto')).toBe(false)
    expect(sentenceOpensParkmerke('Essen')).toBe(false)
    expect(sentenceOpensParkmerke('Trinken')).toBe(false)
    expect(sentenceOpensParkmerke('Freizeit')).toBe(false)
    expect(sentenceOpensParkmerke('Ticket für das Konzert')).toBe(false)
    expect(sentenceOpensParkmerke('Ich gehe in den Park')).toBe(false)
  })

})
