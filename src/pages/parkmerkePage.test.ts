import 'fake-indexeddb/auto'
import { createElement } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ParkmerkePage } from './ParkmerkePage'
import { isOsmTileGet, requestCarriesSpot } from '../lib/parkmerke'
import { deleteParkingSpot, loadParkingSpot, resetParkmerkeStore, saveParkingSpot } from '../lib/parkmerkeStore'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let activeRoot: ReturnType<typeof createRoot> | null = null
let online = true

async function unmount() {
  if (!activeRoot) return
  const root = activeRoot
  activeRoot = null
  await act(async () => {
    root.unmount()
  })
}

async function mount() {
  await unmount()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const root = createRoot(host)
  activeRoot = root
  await act(async () => {
    root.render(createElement(ParkmerkePage))
  })
  for (let i = 0; i < 30 && !host.querySelector('[data-park-ready="1"]'); i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
  }
  return host
}

function choosePhoto(input: HTMLInputElement, bytes: string) {
  const file = new File([bytes], 'car.jpg', { type: 'image/jpeg' })
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    },
  })
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

function mockGeo(lat: number, lng: number) {
  const getCurrentPosition = vi.fn((success: PositionCallback) => {
    success({
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy: 8,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON() {
          return {}
        },
      },
      timestamp: Date.now(),
      toJSON() {
        return {}
      },
    })
  })
  const watchPosition = vi.fn()
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition, watchPosition, clearWatch: vi.fn() },
  })
  return { getCurrentPosition, watchPosition }
}

async function click(host: HTMLElement, selector: string) {
  const node = host.querySelector(selector) as HTMLButtonElement
  await act(async () => {
    node.click()
    await new Promise((resolve) => setTimeout(resolve, 30))
  })
}

describe('Parkmerke screen', () => {
  beforeEach(async () => {
    online = true
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online })
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const notice = document.querySelector('[data-park-map-notice]')
      const style = notice ? window.getComputedStyle(notice) : null
      const noticeVisible = Boolean(
        notice?.isConnected &&
          notice.textContent?.includes('Die Kartenbilder lädt Ihr Browser von der OpenStreetMap Foundation (Großbritannien). Dabei erhält sie Ihre IP-Adresse und erkennt den Kartenausschnitt.') &&
          style &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0',
      )
      recorded.push({
        url,
        method: init?.method ?? 'GET',
        body: init?.body ?? null,
        noticeVisible,
        referrerPolicy: init?.referrerPolicy ?? '',
        cache: init?.cache ?? '',
      })
      return new Response(new Blob(['png'], { type: 'image/png' }))
    })
    await resetParkmerkeStore()
  })

  const recorded: {
    url: string
    method: string
    body: unknown
    noticeVisible: boolean
    referrerPolicy: ReferrerPolicy | ''
    cache: RequestCache | ''
  }[] = []

  beforeEach(() => {
    recorded.length = 0
  })

  afterEach(async () => {
    await unmount()
    vi.restoreAllMocks()
    await resetParkmerkeStore()
  })

  it('saves one spot, shows the pin and the remaining time, and sends neither photo nor coordinates', async () => {
    online = false
    const geo = mockGeo(52.52, 13.405)
    const host = await mount()
    expect(host.querySelector('[data-park-ready="1"]')).toBeTruthy()
    expect(host.querySelector('[data-orbi-kind]')).toBeNull()
    expect(host.querySelector('[data-park-offline="1"]')?.textContent).toContain('Offline')
    expect(host.querySelector('[data-park-storage="local"]')?.textContent).toBe(
      'Foto, Pin und Zeit bleiben auf diesem Gerät.',
    )
    expect(host.textContent).toContain('Bitte kein fremdes Kennzeichen ins Bild nehmen.')
    expect(host.textContent).not.toMatch(/Andere Autos|werden nicht gezeigt|Nur auf diesem Gerät gespeichert/i)
    expect(host.textContent).not.toMatch(/reservier|gebucht|buchen|bezahl|preis/i)
    expect(host.querySelector('[data-park-map-block]')).toBeNull()

    const input = host.querySelector('[data-park-gallery]') as HTMLInputElement
    await act(async () => {
      choosePhoto(input, 'blue-car')
    })
    await click(host, '[data-park-locate]')
    const block = host.querySelector('[data-park-map-block]')
    expect(block?.textContent).toContain(
      'Die Kartenbilder lädt Ihr Browser von der OpenStreetMap Foundation (Großbritannien). Dabei erhält sie Ihre IP-Adresse und erkennt den Kartenausschnitt.',
    )
    expect(block?.querySelector('[data-park-map-credit]')?.textContent).toBe('© OpenStreetMap-Mitwirkende')
    expect(block?.querySelector('[data-park-map-credit]')?.getAttribute('href')).toBe(
      'https://www.openstreetmap.org/copyright',
    )
    expect(block?.textContent).not.toContain('bleiben auf diesem Gerät')
    expect(block?.contains(host.querySelector('[data-park-storage="local"]'))).toBe(false)
    await click(host, '[data-park-preset="60"]')
    await click(host, '[data-park-save]')

    expect(host.querySelector('[data-park-pin="1"]')).toBeTruthy()
    expect(host.querySelector('[data-park-photo="1"]')).toBeTruthy()
    expect(host.querySelector('[data-park-remaining]')?.getAttribute('data-park-remaining')).toMatch(/^(1:00:00|59:5)/)
    expect(host.querySelector('[data-park-coords]')?.getAttribute('data-park-coords')).toBe('52.52000, 13.40500')
    const savedMap = host.querySelector('[data-park-map-block]')
    expect(savedMap?.querySelector('[data-park-map-credit]')?.textContent).toBe('© OpenStreetMap-Mitwirkende')
    expect(savedMap?.contains(host.querySelector('[data-park-storage="local"]'))).toBe(false)
    expect(host.querySelector('[data-park-memory]')?.contains(host.querySelector('[data-park-storage="local"]'))).toBe(true)
    const stored = await loadParkingSpot()
    expect(await stored?.photo.text()).toBe('blue-car')
    expect(geo.watchPosition).not.toHaveBeenCalled()
    expect(recorded).toEqual([])
    expect(recorded.every((call) => !requestCarriesSpot(call.url, call.body, { lat: 52.52, lng: 13.405, photo: stored?.photo }))).toBe(true)
  })

  it('replaces the spot only after confirmation and delete removes it', async () => {
    online = false
    mockGeo(52.52, 13.405)
    const host = await mount()
    const input = host.querySelector('[data-park-gallery]') as HTMLInputElement
    await act(async () => {
      choosePhoto(input, 'first-car')
    })
    await click(host, '[data-park-locate]')
    await click(host, '[data-park-preset="90"]')
    await click(host, '[data-park-save]')
    expect(await (await loadParkingSpot())?.photo.text()).toBe('first-car')

    await click(host, '[data-park-new]')
    const next = host.querySelector('[data-park-gallery]') as HTMLInputElement
    await act(async () => {
      choosePhoto(next, 'second-car')
    })
    mockGeo(48.137, 11.575)
    await click(host, '[data-park-locate]')
    await click(host, '[data-park-preset="30"]')
    await click(host, '[data-park-save]')

    expect(host.querySelector('[data-park-confirm="1"]')).toBeTruthy()
    expect(await (await loadParkingSpot())?.photo.text()).toBe('first-car')
    expect((await loadParkingSpot())?.lat).toBe(52.52)
    expect(host.querySelector('[data-park-coords]')?.getAttribute('data-park-coords')).toBe('52.52000, 13.40500')

    await click(host, '[data-park-replace]')
    expect(await (await loadParkingSpot())?.photo.text()).toBe('second-car')
    expect((await loadParkingSpot())?.lat).toBe(48.137)
    expect(host.querySelector('[data-park-confirm="1"]')).toBeNull()

    await click(host, '[data-park-delete]')
    expect(await loadParkingSpot()).toBeNull()
    expect(host.querySelector('[data-park-saved]')).toBeNull()
    expect(host.textContent).toContain('Noch kein Platz')
    expect(recorded).toEqual([])
  })

  it('stops the timer when the page closes and warns on screen without asking for notification permission', async () => {
    const endsAt = Date.now() + 5 * 60_000
    await saveParkingSpot(
      {
        photo: new Blob(['soon'], { type: 'image/jpeg' }),
        lat: 52.52,
        lng: 13.405,
        accuracy: 4,
        endsAt,
      },
      false,
      Date.now(),
    )
    const notes: { title: string; body?: string }[] = []
    class LocalNote {
      static permission: NotificationPermission = 'default'
      constructor(title: string, init?: NotificationOptions) {
        notes.push({ title, body: init?.body })
      }
      static requestPermission() {
        throw new Error('permission must not be requested')
      }
    }
    vi.stubGlobal('Notification', LocalNote)
    const realSet = window.setInterval.bind(window)
    const realClear = window.clearInterval.bind(window)
    const ids: number[] = []
    vi.spyOn(window, 'setInterval').mockImplementation(((handler: TimerHandler, timeout?: number) => {
      const id = realSet(handler, timeout) as unknown as number
      ids.push(id)
      return id
    }) as typeof window.setInterval)
    const clearSpy = vi.spyOn(window, 'clearInterval').mockImplementation(((id?: number) => {
      if (id != null) realClear(id)
    }) as typeof window.clearInterval)

    const host = await mount()
    expect(host.querySelector('[data-park-warn="soon"]')?.textContent).toContain('endet bald')
    expect(notes).toEqual([])
    expect(ids.length).toBeGreaterThan(0)

    await unmount()
    expect(clearSpy.mock.calls.some((call) => ids.includes(call[0] as number))).toBe(true)

    LocalNote.permission = 'granted'
    const again = await mount()
    expect(again.querySelector('[data-park-warn="soon"]')).toBeTruthy()
    expect(notes).toEqual([{ title: 'Parkmerke', body: 'Die Parkzeit endet bald.' }])
    expect(notes[0]?.body).not.toContain('52.52')
    expect(await loadParkingSpot()).not.toBeNull()
    await deleteParkingSpot()
  })

  it('uses only OpenStreetMap image GETs while the page is open and online', async () => {
    online = true
    mockGeo(52.52, 13.405)
    const host = await mount()
    const input = host.querySelector('[data-park-gallery]') as HTMLInputElement
    await act(async () => {
      choosePhoto(input, 'tile-car')
    })
    await click(host, '[data-park-locate]')
    for (let i = 0; i < 20 && recorded.length === 0; i += 1) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
      })
    }
    const notice = host.querySelector('[data-park-map-notice]')
    expect(notice?.textContent).toBe('Die Kartenbilder lädt Ihr Browser von der OpenStreetMap Foundation (Großbritannien). Dabei erhält sie Ihre IP-Adresse und erkennt den Kartenausschnitt.')
    const noticeStyle = window.getComputedStyle(notice as Element)
    expect(noticeStyle.display).not.toBe('none')
    expect(noticeStyle.visibility).not.toBe('hidden')
    expect(host.querySelector('[data-park-map-credit]')?.textContent).toBe('© OpenStreetMap-Mitwirkende')
    expect(host.querySelector('[data-park-map-credit]')?.getAttribute('href')).toBe(
      'https://www.openstreetmap.org/copyright',
    )
    expect(host.querySelector('[data-park-map-block]')?.contains(host.querySelector('[data-park-storage="local"]'))).toBe(
      false,
    )
    expect(recorded.length).toBeGreaterThan(0)
    for (const call of recorded) {
      expect(call.noticeVisible).toBe(true)
      expect(call.referrerPolicy).toBe('strict-origin')
      expect(call.cache).toBe('no-store')
      expect(call.method).toBe('GET')
      expect(call.body).toBeNull()
      expect(isOsmTileGet(call.url)).toBe(true)
      expect(requestCarriesSpot(call.url, call.body, { lat: 52.52, lng: 13.405 })).toBe(false)
      expect(call.url).not.toContain('tile-car')
      expect(call.url).not.toContain('52.52')
      expect(call.url).not.toContain('13.405')
    }
    await unmount()
    const before = recorded.length
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(recorded.length).toBe(before)
  })

  it('does not request a map image while the OpenStreetMap notice is hidden', async () => {
    online = true
    mockGeo(52.52, 13.405)
    const realStyle = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) => {
      if (element instanceof HTMLElement && element.getAttribute('data-park-map-notice') === '1') {
        return { display: 'none', visibility: 'visible', opacity: '1' } as CSSStyleDeclaration
      }
      return realStyle(element)
    })
    const host = await mount()
    const input = host.querySelector('[data-park-gallery]') as HTMLInputElement
    await act(async () => {
      choosePhoto(input, 'hidden-notice')
    })
    await click(host, '[data-park-locate]')
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80))
    })
    expect(host.querySelector('[data-park-map-notice]')?.textContent).toContain('OpenStreetMap')
    expect(recorded).toEqual([])
  })
})
