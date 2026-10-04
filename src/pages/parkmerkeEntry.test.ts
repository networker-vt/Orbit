import { createElement } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import { MehrPage } from './MehrPage'
import { AuthProvider } from '../lib/auth'
import { __resetCreditsForTests, getCredits } from '../lib/credits'
import { I18nProvider } from '../lib/i18n'
import { resetPrefs, getPrefs } from '../lib/prefs'
import { resetStore } from '../lib/store'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let activeRoot: ReturnType<typeof createRoot> | null = null

function PathMark() {
  const { pathname } = useLocation()
  return createElement('span', { 'data-path': pathname })
}

async function mount(node: ReturnType<typeof createElement>) {
  if (activeRoot) {
    const previous = activeRoot
    activeRoot = null
    await act(async () => {
      previous.unmount()
    })
  }
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const root = createRoot(host)
  activeRoot = root
  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        null,
        createElement(I18nProvider, null, createElement(AuthProvider, null, node, createElement(PathMark))),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  return host
}

async function typeAndSubmit(host: HTMLElement, value: string) {
  const area = host.querySelector('textarea') as HTMLTextAreaElement
  const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
  await act(async () => {
    proto?.set?.call(area, value)
    area.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const form = host.querySelector('form') as HTMLFormElement
  await act(async () => {
    form.requestSubmit()
    await new Promise((resolve) => setTimeout(resolve, 30))
  })
}

describe('Parkmerke entry', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetStore()
    resetPrefs()
    __resetCreditsForTests()
  })

  it('does not add a fourth button on the start screen', async () => {
    const host = await mount(createElement(HomePage))
    expect([...host.querySelectorAll('[data-life-example]')].map((node) => node.getAttribute('data-life-example'))).toEqual([
      'Essen',
      'Trinken',
      'Freizeit',
    ])
    expect(host.querySelector('[data-parkmerke-entry]')).toBeNull()
    const labels = [...host.querySelectorAll('a,button')].map((node) => node.textContent?.trim())
    expect(labels).not.toContain('Parkmerke')
  })

  it('opens Parkmerke from the sentence without touching credits', async () => {
    const host = await mount(createElement(HomePage))
    const before = getCredits()
    await typeAndSubmit(host, 'Parkmerke')
    expect(host.querySelector('[data-path]')?.getAttribute('data-path')).toBe('/parkmerke')
    expect(getPrefs().seeker.lifeSentence).toBe('')
    const after = getCredits()
    expect(after.assistUsed ?? 0).toBe(before.assistUsed ?? 0)
    expect(after.balance).toBe(before.balance)
    expect(after.txs).toEqual(before.txs)
  })

  it('leaves an Auto sentence on the start screen', async () => {
    const host = await mount(createElement(HomePage))
    await typeAndSubmit(host, 'Ich biete Fitness und ein Auto')
    expect(host.querySelector('[data-path]')?.getAttribute('data-path')).toBe('/')
    expect(getPrefs().seeker.lifeSentence).toBe('Ich biete Fitness und ein Auto')
  })

  it('lists Parkmerke under Mehr, outside the tile grid', async () => {
    const host = await mount(createElement(MehrPage))
    const entry = host.querySelector('[data-parkmerke-entry]')
    expect(entry?.textContent?.trim()).toBe('Parkmerke')
    expect(entry?.getAttribute('href')).toBe('/parkmerke')
    expect(entry?.closest('[data-tile-grid]')).toBeNull()
    expect(host.textContent).toContain('wo das Auto steht')
    expect(host.textContent).not.toMatch(/reservier|gebucht|buchen|bezahl|preis/i)
  })
})
