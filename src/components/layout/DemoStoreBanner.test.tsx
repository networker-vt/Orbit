import { createElement } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DemoStoreBanner } from './DemoStoreBanner'
import { I18nProvider } from '../../lib/i18n'
import { __setAppModeForTests } from '../../lib/flags'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function mount() {
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        null,
        createElement(I18nProvider, null, createElement(DemoStoreBanner)),
      ),
    )
  })
  return {
    host,
    async unmount() {
      await act(async () => {
        root.unmount()
      })
    },
  }
}

describe('DemoStoreBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
    __setAppModeForTests('demo')
  })

  afterEach(() => {
    __setAppModeForTests(null)
  })

  it('shows honesty copy in demo mode and dismisses for the session', async () => {
    const view = await mount()
    const banner = view.host.querySelector('[data-demo-store-banner]')
    expect(banner).toBeTruthy()
    expect(banner?.textContent).toMatch(/Demo/)
    expect(banner?.textContent).toMatch(/kein echtes Geld|No real money/i)

    const dismiss = view.host.querySelector('button')
    expect(dismiss).toBeTruthy()
    await act(async () => {
      dismiss!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    })
    expect(view.host.querySelector('[data-demo-store-banner]')).toBeNull()
    expect(sessionStorage.getItem('orbit_demo_banner_dismissed_v1')).toBe('1')
    await view.unmount()
  })

  it('stays hidden in prod mode', async () => {
    __setAppModeForTests('prod')
    const view = await mount()
    expect(view.host.querySelector('[data-demo-store-banner]')).toBeNull()
    await view.unmount()
  })
})
