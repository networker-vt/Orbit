import { beforeEach, describe, expect, it } from 'vitest'
import { __setFlagForTests } from './flags'
import { tStatic } from './i18n'
import {
  HOME_DISCOVER_DEFS,
  MEHR_DISCOVER_DEFS,
  MEIN_ACCOUNT_DEFS,
  HOME_PRIMARY_COUNT,
  everyTileHasEmoji,
  homeDiscoverHasAccountLinks,
  homeDiscoverTiles,
  splitAdaptiveHome,
  mehrDiscoverTiles,
  meinAccountTiles,
  meinHasDiscoverLinks,
} from './hubTiles'

const adult = { kids: false, hideTravel: false, hideWallet: false }
const kids = { kids: true, hideTravel: true, hideWallet: true }

describe('Orbit 2.8.1 hub split', () => {
  beforeEach(() => {
    __setFlagForTests(null)
  })
  it('Home discover is destinations only — no Mein, Social, Wallet, Firma', () => {
    const tiles = homeDiscoverTiles((k) => tStatic(k, 'de'), adult)
    const paths = tiles.map((t) => t.to)
    expect(paths).toContain('/abflug')
    expect(paths).toContain('/match')
    expect(paths).toContain('/kabine')
    expect(paths).toContain('/dashboard')
    expect(paths).not.toContain('/campus')
    expect(paths).not.toContain('/entdecker')
    expect(paths).not.toContain('/firma')
    expect(homeDiscoverHasAccountLinks(tiles)).toBe(false)
    expect(paths.some((p) => p === '/mein' || p.startsWith('/social') || p === '/wallet')).toBe(false)
  })

  it('Mehr discover also omits Mein / Social / Wallet and keeps Firma off Home only', () => {
    const tiles = mehrDiscoverTiles((k) => tStatic(k, 'de'), adult)
    expect(homeDiscoverHasAccountLinks(tiles)).toBe(false)
    expect(tiles.some((t) => t.to === '/marktplatz')).toBe(true)
    expect(tiles.some((t) => t.to === '/firma')).toBe(true)
  })

  it('Mein hub is account-only and sorted money → identity → create → connect → tools', () => {
    const tiles = meinAccountTiles((k) => tStatic(k, 'de'), adult)
    const ids = tiles.map((t) => t.id)
    expect(ids).toEqual(['profile', 'prefs', 'create', 'offer', 'language', 'dashboard', 'refer'])
    expect(meinHasDiscoverLinks(tiles)).toBe(false)
    expect(tiles.some((t) => t.to === '/ideen')).toBe(false)
    expect(tiles.some((t) => t.to === '/channels')).toBe(false)
    expect(tiles.some((t) => t.to === '/wallet')).toBe(false)
    expect(tiles.some((t) => t.to === '/listings/new')).toBe(true)
    expect(tiles.find((t) => t.id === 'create')?.demo).toBeFalsy()
    expect(tiles.find((t) => t.id === 'offer')?.demo).toBeFalsy()
    const refer = tiles.find((t) => t.id === 'refer')
    expect(refer?.emoji).not.toBe('🎁')
    expect(refer?.icon).toBe('share')
    expect(refer?.label).toBe('Orbit weiterempfehlen')
  })

  it('Kids hide Wallet / create / offer on Mein and travel / kabine / crew on Home', () => {
    const mein = meinAccountTiles((k) => tStatic(k, 'de'), kids)
    expect(mein.some((t) => t.id === 'wallet' || t.id === 'create' || t.id === 'offer' || t.id === 'refer')).toBe(
      false,
    )
    const home = homeDiscoverTiles((k) => tStatic(k, 'de'), kids)
    expect(home.some((t) => t.id === 'abflug' || t.id === 'firma' || t.id === 'crew' || t.id === 'kabine')).toBe(false)
    expect(home.some((t) => t.id === 'campus' || t.id === 'entdecker')).toBe(false)
  })

  it('Home discover pins Match / Abflug / Kabine / Dashboard with larger primary set', () => {
    const split = splitAdaptiveHome(adult, {}, (k) => tStatic(k, 'de'))
    expect(HOME_PRIMARY_COUNT).toBe(4)
    expect(split.primary).toHaveLength(4)
    expect(split.primary.map((t) => t.id)).toEqual(['match', 'abflug', 'kabine', 'dashboard'])
    expect(split.primary.some((t) => t.id === 'firma')).toBe(false)
    expect(homeDiscoverHasAccountLinks(split.primary)).toBe(false)
    expect(split.folded.some((t) => t.id === 'jobs')).toBe(true)
    const kidsSplit = splitAdaptiveHome(kids, {}, (k) => tStatic(k, 'de'))
    expect(kidsSplit.primary.length).toBeLessThanOrEqual(4)
    expect(kidsSplit.primary.some((t) => t.id === 'abflug' || t.id === 'firma' || t.id === 'crew' || t.id === 'kabine')).toBe(false)
  })

  it('every catalog tile has a visible emoji', () => {
    expect(everyTileHasEmoji(HOME_DISCOVER_DEFS)).toBe(true)
    expect(everyTileHasEmoji(MEHR_DISCOVER_DEFS)).toBe(true)
    expect(everyTileHasEmoji(MEIN_ACCOUNT_DEFS)).toBe(true)
    expect(everyTileHasEmoji(homeDiscoverTiles((k) => tStatic(k, 'en'), adult))).toBe(true)
    expect(everyTileHasEmoji(meinAccountTiles((k) => tStatic(k, 'en'), adult))).toBe(true)
  })
})
