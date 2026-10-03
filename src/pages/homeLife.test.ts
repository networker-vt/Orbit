import { createElement } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import { MatchPage } from './MatchPage'
import { AuthProvider } from '../lib/auth'
import { I18nProvider } from '../lib/i18n'
import { confirmAdult } from '../lib/ageGate'
import { getPrefs, resetPrefs, savePrefs } from '../lib/prefs'
import { resetStore, store } from '../lib/store'
import { seedListings } from '../data/seed'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let activeRoot: ReturnType<typeof createRoot> | null = null

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
    root.render(createElement(MemoryRouter, null, createElement(I18nProvider, null, createElement(AuthProvider, null, node))))
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

  it('shows Essen, Trinken and Freizeit off, one search, one bubble and one CTA', async () => {
    const { host } = await mount(createElement(HomePage))
    const examples = [...host.querySelectorAll('[data-life-example]')].map((node) => ({
      name: node.getAttribute('data-life-example'),
      pressed: node.getAttribute('aria-pressed'),
    }))
    expect(examples).toEqual([
      { name: 'Essen', pressed: 'false' },
      { name: 'Trinken', pressed: 'false' },
      { name: 'Freizeit', pressed: 'false' },
    ])
    expect(host.querySelector('[data-life-examples]')?.className).not.toContain('grid')
    expect(host.querySelectorAll('textarea')).toHaveLength(1)
    expect(host.querySelector('textarea')?.getAttribute('placeholder') ?? '').not.toMatch(/Berlin|billigst|cheapest|Flug/i)
    expect(host.querySelectorAll('[data-orbi-bubble]')).toHaveLength(1)
    expect(host.querySelectorAll('[data-home-primary]')).toHaveLength(1)
    const labels = [...host.querySelectorAll('button')].map((button) => button.textContent?.trim())
    expect(labels).not.toContain('Fitness')
    expect(labels).not.toContain('Auto')
    expect(labels).not.toContain('Arbeit')
    expect(labels).not.toContain('Vollzeit')
    expect(host.textContent).not.toContain('Sara König')
    expect(getPrefs().seeker.jobTypes).toEqual([])
  })

  it('does not switch the examples on when old industries are saved', async () => {
    const current = getPrefs()
    savePrefs({
      seeker: {
        ...current.seeker,
        industries: ['Gastronomie / Hotel'],
      },
    })
    const { host } = await mount(createElement(HomePage))
    for (const name of ['Essen', 'Trinken', 'Freizeit']) {
      expect(host.querySelector(`[data-life-example="${name}"]`)?.getAttribute('aria-pressed')).toBe('false')
    }
    const essen = host.querySelector('[data-life-example="Essen"]') as HTMLButtonElement
    await act(async () => {
      essen.click()
    })
    expect(getPrefs().seeker.lifeExamples).toEqual(['Essen'])
    expect(getPrefs().seeker.industries).toEqual(['Gastronomie / Hotel'])
    expect(host.querySelector('[data-life-example="Essen"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(host.querySelector('[data-life-example="Trinken"]')?.getAttribute('aria-pressed')).toBe('false')
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
    expect([...host.querySelectorAll('[data-life-example]')].map((node) => node.textContent?.trim())).toEqual([
      'Essen',
      'Trinken',
      'Freizeit',
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

  it('stays on one sentence after Essen when nothing real matches', async () => {
    const current = getPrefs()
    savePrefs({ seeker: { ...current.seeker, lifeExamples: ['Essen'] } })
    const { host } = await mount(createElement(MatchPage))
    expect(host.querySelector('[data-match-empty="none"] p')?.textContent).toBe('Dazu ist noch nichts da.')
    expect(host.querySelectorAll('button')).toHaveLength(1)
    expect(host.textContent).not.toContain('Sara König')
  })

  it('shows one sentence and one button, and no sample person', async () => {
    const { host } = await mount(createElement(MatchPage))
    expect(host.querySelector('[data-match-empty="choice"] p')?.textContent).toBe(
      'Die Liste bleibt leer, bis du etwas wählst.',
    )
    const buttons = [...host.querySelectorAll('button')]
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.textContent).toContain('Zum Start')
    expect(host.textContent).not.toContain('Sara König')
    expect(host.textContent).not.toContain('Alex Müller')
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
