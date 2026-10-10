import { createElement } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LEGAL } from '../lib/legal'
import { AgbPage } from '../pages/legal/AgbPage'
import { DatenschutzPage } from '../pages/legal/DatenschutzPage'
import { ImpressumPage } from '../pages/legal/ImpressumPage'
import { RankingPage } from '../pages/legal/RankingPage'
import { SupportPage } from '../pages/legal/SupportPage'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function legalRoutes(initialPath: string) {
  return createElement(
    MemoryRouter,
    { initialEntries: [initialPath] },
    createElement(
      Routes,
      null,
      createElement(Route, { path: 'impressum', element: createElement(ImpressumPage) }),
      createElement(Route, { path: 'datenschutz', element: createElement(DatenschutzPage) }),
      createElement(Route, { path: 'privacy', element: createElement(DatenschutzPage) }),
      createElement(Route, { path: 'support', element: createElement(SupportPage) }),
      createElement(Route, { path: 'agb', element: createElement(AgbPage) }),
      createElement(Route, { path: 'ranking', element: createElement(RankingPage) }),
      createElement(Route, { path: '*', element: createElement('p', null, 'missing-legal-route') }),
    ),
  )
}

async function renderAt(path: string) {
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(legalRoutes(path))
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

async function clickLink(host: HTMLElement, href: string) {
  const link = host.querySelector<HTMLAnchorElement>(`a[href="${href}"]`)
  expect(link, `link ${href}`).toBeTruthy()
  await act(async () => {
    link!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  })
}

describe('legal routes', () => {
  it('renders privacy, support, and impressum, including a trailing slash', async () => {
    const privacy = await renderAt('/privacy')
    expect(privacy.host.querySelector('h1')?.textContent).toBe('Datenschutz / Privacy')
    expect(privacy.host.textContent).toContain('Verantwortlich')
    expect(privacy.host.textContent).toContain('TDDDG')
    expect(privacy.host.textContent).toContain('Art. 14')
    expect(privacy.host.textContent).toContain(
      'Die Kartenbilder lädt Ihr Browser von der OpenStreetMap Foundation (Großbritannien). Dabei erhält sie Ihre IP-Adresse und erkennt den Kartenausschnitt.',
    )
    expect(privacy.host.querySelector('a[href="https://osmfoundation.org/wiki/Privacy_Policy"]')).toBeTruthy()
    expect(privacy.host.textContent).not.toContain('Startklar')
    expect(privacy.host.textContent).not.toContain('BITTE AUSFÜLLEN')
    expect(privacy.host.textContent).not.toMatch(/Telefon:|Phone:/)
    expect(privacy.host.textContent).not.toMatch(/IBAN|Krypto/)
    expect(privacy.host.textContent).not.toContain('missing-legal-route')
    await privacy.unmount()

    const privacySlash = await renderAt('/privacy/')
    expect(privacySlash.host.querySelector('h1')?.textContent).toBe('Datenschutz / Privacy')
    await privacySlash.unmount()

    const alias = await renderAt('/datenschutz/')
    expect(alias.host.querySelector('h1')?.textContent).toBe('Datenschutz / Privacy')
    await alias.unmount()

    const support = await renderAt('/support/')
    expect(support.host.querySelector('h1')?.textContent).toBe('Support')
    expect(support.host.textContent).toContain('mirco.kuessner@gmail.com')
    expect(support.host.textContent).not.toMatch(/Demo-App/i)
    await support.unmount()

    const impressum = await renderAt('/impressum/')
    expect(impressum.host.querySelector('h1')?.textContent).toBe('Impressum')
    expect(impressum.host.textContent).toContain('Mirco Küßner')
    expect(impressum.host.textContent).not.toContain('ec.europa.eu')
    expect(impressum.host.textContent).not.toContain('BITTE AUSFÜLLEN')
    expect(impressum.host.textContent).not.toContain('Telefon:')
    expect(impressum.host.textContent).not.toContain('Gewerbe')
    expect(LEGAL.phone).toContain('BITTE AUSFÜLLEN')
    expect(LEGAL.tradeStatus).toContain('BITTE AUSFÜLLEN')

    const agb = await renderAt('/agb')
    expect(agb.host.textContent).toContain('nicht anwaltlich geprüft')
    expect(agb.host.textContent).toContain('Vermittler')
    expect(agb.host.textContent).not.toContain('Kabine')
    expect(agb.host.textContent).not.toContain('Lernen')
    await agb.unmount()
    await impressum.unmount()
  })

  it('navigates in-app between impressum, privacy, and support', async () => {
    const view = await renderAt('/impressum')
    expect(view.host.querySelector('h1')?.textContent).toBe('Impressum')

    await clickLink(view.host, '/privacy')
    expect(view.host.querySelector('h1')?.textContent).toBe('Datenschutz / Privacy')

    await clickLink(view.host, '/support')
    expect(view.host.querySelector('h1')?.textContent).toBe('Support')

    await clickLink(view.host, '/impressum')
    expect(view.host.querySelector('h1')?.textContent).toBe('Impressum')
    await view.unmount()
  })
})
