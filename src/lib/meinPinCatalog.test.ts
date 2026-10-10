import { describe, expect, it } from 'vitest'
import { tStatic } from './i18n'
import { toHomePin, visibleMeinPinOptions } from './meinPinCatalog'

const adult = { kids: false, hideTravel: false, hideWallet: false }

describe('meinPinCatalog', () => {
  it('builds HomePin payloads for the shared orbit_home_pins_v1 writer', () => {
    const opt = visibleMeinPinOptions(adult).find((d) => d.id === 'match')
    expect(opt).toBeTruthy()
    const pin = toHomePin(opt!, (k) => tStatic(k, 'de'))
    expect(pin).toEqual({ id: 'match', to: '/match', label: 'Match', emoji: '🎯' })
  })

  it('hides Abflug when travel is off', () => {
    expect(
      visibleMeinPinOptions({ kids: true, hideTravel: true, hideWallet: true }).some(
        (d) => d.id === 'abflug',
      ),
    ).toBe(false)
  })
})
