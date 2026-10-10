import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  HOME_PINS_KEY,
  HOME_PINS_MAX,
  addHomePin,
  getHomePins,
  isHomePinned,
  resetHomePins,
  setHomePins,
  toggleHomePin,
} from './homePins'

describe('homePins shared list', () => {
  beforeEach(() => {
    localStorage.clear()
    resetHomePins()
  })

  afterEach(() => {
    resetHomePins()
  })

  it('uses one documented storage key', () => {
    expect(HOME_PINS_KEY).toBe('orbit_home_pins_v1')
    addHomePin({ id: 'parkmerke', to: '/parkmerke', label: 'Parkmerke', emoji: '🅿️' })
    expect(localStorage.getItem(HOME_PINS_KEY)).toContain('parkmerke')
  })

  it('rejects unsafe or empty pins and dedupes by id', () => {
    setHomePins([
      { id: 'ok', to: '/abflug', label: 'Abflug' },
      { id: 'ok', to: '/abflug', label: 'Dup' },
      { id: 'bad', to: 'https://evil.example', label: 'Nope' },
      { id: 'empty', to: '/', label: '' },
    ])
    expect(getHomePins()).toEqual([{ id: 'ok', to: '/abflug', label: 'Abflug' }])
  })

  it('toggles and caps at HOME_PINS_MAX', () => {
    const many = Array.from({ length: HOME_PINS_MAX + 3 }, (_, i) => ({
      id: `p${i}`,
      to: `/x${i}`,
      label: `Pin ${i}`,
    }))
    expect(setHomePins(many)).toHaveLength(HOME_PINS_MAX)
    const t = toggleHomePin({ id: 'p0', to: '/x0', label: 'Pin 0' })
    expect(t.pinned).toBe(false)
    expect(isHomePinned('p0')).toBe(false)
    const t2 = toggleHomePin({ id: 'park', to: '/parkmerke', label: 'Parkmerke' })
    expect(t2.pinned).toBe(true)
    expect(isHomePinned('park')).toBe(true)
  })
})
