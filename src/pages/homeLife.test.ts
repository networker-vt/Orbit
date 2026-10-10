import { createElement } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import { MatchPage } from './MatchPage'
import { PrefsPage } from './PrefsPage'
import { EssenPage } from './EssenPage'
import { AuthProvider } from '../lib/auth'
import { I18nProvider } from '../lib/i18n'
import { confirmAdult } from '../lib/ageGate'
import { getPrefs, resetPrefs, savePrefs } from '../lib/prefs'
import { resetStore, store } from '../lib/store'
import { seedListings } from '../data/seed'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let activeRoot: ReturnType<typeof createRoot> | null = null

async function mount(node: ReturnType<typeof createElement>, initialPath = '/') {
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
        { initialEntries: [initialPath] },
        createElement(
          I18nProvider,
          null,
          createElement(AuthProvider, null, node),
        ),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  return { host, root }
}

describe('first screen for a new visitor', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetStore()
    resetPrefs()
  })

  afterEach(async () => {
    if (!activeRoot) return
    const root = activeRoot
    activeRoot = null
    await act(async () => {
      root.unmount()
    })
  })

  it('shows three presets, one search, one bubble and one CTA', async () => {
    const { host } = await mount(createElement(HomePage))
    const presets = [...host.querySelectorAll('[data-home-preset]')].map((node) =>
      node.getAttribute('data-home-preset'),
    )
    expect(presets).toEqual(['essen', 'money', 'reise'])
    expect(host.textContent).toContain("Was gibt's heute zu essen")
    expect(host.textContent).toContain('I need money')
    expect(host.textContent).toContain('plane meine Reise')
    expect(host.textContent).toMatch(/Was machen wir jetzt/)
    expect(host.querySelector('[data-home-presets]')?.className).not.toContain('grid')
    expect(host.querySelectorAll('textarea')).toHaveLength(1)
    expect(host.querySelector('textarea')?.getAttribute('placeholder') ?? '').not.toMatch(/Berlin|billigst|cheapest|Flug/i)
    expect(host.querySelectorAll('[data-orbi-bubble]')).toHaveLength(1)
    expect(host.querySelectorAll('[data-home-primary]')).toHaveLength(1)
    expect(host.querySelector('[data-news-ticker]')).toBeTruthy()
    expect(host.querySelector('[data-home-pins]')).toBeTruthy()
    expect(host.querySelector('[data-home-pins]')?.getAttribute('data-home-pins')).toBe('0')
    const discover = host.querySelector('[data-home-discover]')
    expect(discover).toBeTruthy()
    expect(discover?.querySelector('[data-tile-icon-size="lg"]')).toBeTruthy()
    const tileIds = [...(discover?.querySelectorAll('[data-tile-id]') ?? [])].map((n) =>
      n.getAttribute('data-tile-id'),
    )
    expect(tileIds).toEqual(['match', 'abflug', 'kabine', 'dashboard'])
    expect(tileIds).not.toContain('firma')
    expect(host.textContent).not.toContain('Sara König')
    expect(getPrefs().seeker.jobTypes).toEqual([])
  })

  it('routes money preset into prefs work surface', async () => {
    const { host } = await mount(
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/', element: createElement(HomePage) }),
        createElement(Route, { path: '/prefs', element: createElement(PrefsPage) }),
      ),
      '/',
    )
    const money = host.querySelector('[data-home-preset="money"]') as HTMLButtonElement
    await act(async () => {
      money.click()
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(host.querySelector('[data-prefs-desired-work]')).toBeTruthy()
    expect(host.textContent).toContain('Was du arbeiten willst')
  })

  it('opens Essenstipps from the food preset', async () => {
    const { host } = await mount(
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/', element: createElement(HomePage) }),
        createElement(Route, { path: '/essen', element: createElement(EssenPage) }),
      ),
      '/',
    )
    const essen = host.querySelector('[data-home-preset="essen"]') as HTMLButtonElement
    await act(async () => {
      essen.click()
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(host.querySelector('[data-essen-query]')).toBeTruthy()
    expect(host.querySelector('[data-essen-tips]')).toBeTruthy()
    expect(host.textContent).toContain('Essenstipps')
  })

  it('stores any need or offer from the sentence', async () => {
    const { host } = await mount(createElement(HomePage))
    const area = host.querySelector('textarea') as HTMLTextAreaElement
    const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
    await act(async () => {
      proto?.set?.call(area, 'Ich biete Fitness und ein Auto')
      area.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const form = host.querySelector('form') as HTMLFormElement
    await act(async () => {
      form.requestSubmit()
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(getPrefs().seeker.lifeSentence).toBe('Ich biete Fitness und ein Auto')
    expect([...host.querySelectorAll('[data-home-preset]')].map((node) => node.getAttribute('data-home-preset'))).toEqual([
      'essen',
      'money',
      'reise',
    ])
  })
})

describe('match list without a real choice', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetStore()
    resetPrefs()
  })

  afterEach(async () => {
    if (!activeRoot) return
    const root = activeRoot
    activeRoot = null
    await act(async () => {
      root.unmount()
    })
  })

  it('stays on one sentence when the life choice matches nothing', async () => {
    const current = getPrefs()
    savePrefs({ seeker: { ...current.seeker, lifeSentence: 'QuetzalcoatlXYZ' } })
    const { host } = await mount(createElement(MatchPage))
    expect(host.querySelector('[data-match-empty="none"] p')?.textContent).toBe('Dazu ist noch nichts da.')
    expect(host.querySelector('[data-match-rubrics="1"]')).toBeTruthy()
    expect(host.querySelector('[data-match-hub="1"]')).toBeTruthy()
  })

  it('shows rubrics + tools + quiet choice on Jobs, and no sample person', async () => {
    const { host } = await mount(createElement(MatchPage))
    expect(host.querySelector('[data-match-rubrics="1"]')).toBeTruthy()
    expect(host.querySelector('[data-match-rubric="ausgehen"]')).toBeTruthy()
    expect(host.querySelector('[data-match-hub="1"]')).toBeTruthy()
    expect(host.querySelector('[data-match-empty="choice"] p')?.textContent).toContain(
      'Die Liste bleibt leer, bis du etwas wählst',
    )
    const quietBtn = host.querySelector('[data-match-empty="choice"] button')
    expect(quietBtn?.textContent).toContain('Zum Start')
    expect(host.textContent).not.toMatch(/gebucht|reserviert|bestellt/i)
  })

  it('hides alcohol and other people\'s places until 18+ is confirmed', async () => {
    const base = seedListings.find((item) => item.status === 'active')!
    const { id: _id, createdAt: _created, status: _status, ...rest } = base
    store.createListing({
      ...rest,
      title: 'Bier vom Fass',
      description: 'Alkohol',
      city: 'Geheimort-Nord',
      tags: ['Bier'],
      ownerName: 'Theke',
    })
    const current = getPrefs()
    savePrefs({ seeker: { ...current.seeker, lifeSentence: 'Bier' } })
    const closed = await mount(createElement(MatchPage))
    expect(closed.host.querySelector('[data-match-empty="alcohol"] p')?.textContent).toContain('mindestens 18')
    expect([...closed.host.querySelectorAll('button')]).toHaveLength(1)
    expect(closed.host.textContent).not.toContain('Bier vom Fass')
    expect(closed.host.textContent).not.toContain('Geheimort-Nord')

    await act(async () => {
      confirmAdult()
      store.createListing({
        ...rest,
        title: 'Quallenstudio',
        description: 'Ruhig bleiben',
        city: 'Geheimort-West',
        tags: ['Quallenstudio'],
        ownerName: 'Studio Nord',
      })
      savePrefs({ seeker: { ...getPrefs().seeker, lifeSentence: 'Quallenstudio' } })
    })
    const open = await mount(createElement(MatchPage))
    expect(open.host.textContent).toContain('Quallenstudio')
    expect(open.host.textContent).toContain('Studio Nord')
    expect(open.host.textContent).not.toContain('Geheimort-West')
    expect(open.host.textContent).not.toContain('Sara König')
  })
})
