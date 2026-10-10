import { beforeEach, describe, expect, it } from 'vitest'
import { tStatic } from './i18n'
import {
  __resetPinsForTests,
  getPinnedIds,
  MAX_PINS,
  resolvePinnedShortcuts,
  setPinnedIds,
  togglePin,
  visiblePinDefs,
} from './pinnedShortcuts'

const adult = { kids: false, hideTravel: false, hideWallet: false }

describe('pinned Schnellzugriffe', () => {
  beforeEach(() => {
    __resetPinsForTests()
  })

  it('starts empty and toggles pins in order', () => {
    expect(getPinnedIds()).toEqual([])
    togglePin('match')
    togglePin('jobs')
    expect(getPinnedIds()).toEqual(['match', 'jobs'])
    togglePin('match')
    expect(getPinnedIds()).toEqual(['jobs'])
  })

  it('caps at MAX_PINS', () => {
    const ids = ['match', 'jobs', 'abflug', 'dashboard', 'parkmerke', 'social', 'kabine'] as const
    for (const id of ids) togglePin(id)
    expect(getPinnedIds()).toHaveLength(MAX_PINS)
    expect(getPinnedIds()).not.toContain('kabine')
  })

  it('resolves labels for Home in pin order', () => {
    setPinnedIds(['abflug', 'match'])
    const tiles = resolvePinnedShortcuts((k) => tStatic(k, 'de'), adult)
    expect(tiles.map((t) => t.id)).toEqual(['abflug', 'match'])
    expect(tiles[0].label).toBe('Abflug')
    expect(tiles[1].to).toBe('/match')
  })

  it('hides travel pin when travel is hidden', () => {
    const kidsTravel = { kids: true, hideTravel: true, hideWallet: true }
    expect(visiblePinDefs(kidsTravel).some((d) => d.id === 'abflug')).toBe(false)
    setPinnedIds(['abflug', 'match'])
    expect(resolvePinnedShortcuts((k) => tStatic(k, 'de'), kidsTravel).map((t) => t.id)).toEqual([
      'match',
    ])
  })
})
