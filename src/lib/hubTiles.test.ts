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
  it('Home discover is destinations only — no Mein, Social, Wallet', () => {
    const tiles = homeDiscoverTiles((k) => tStatic(k, 'de'), adult)
    const paths = tiles.map((t) => t.to)
    expect(paths).toContain('/abflug')
    expect(paths).toContain('/campus')
    expect(paths).toContain('/entdecker')
    expect(paths).toContain('/kabine')
    expect(paths).toContain('/foto')
    expect(paths).toContain('/interview')
    expect(tiles.find((t) => t.id === 'campus')?.demo).toBe(true)
    expect(tiles.find((t) => t.id === 'kabine')?.demo).toBe(true)
    expect(tiles.find((t) => t.id === 'photoJobs')?.demo).toBe(true)
    expect(tiles.find((t) => t.id === 'interview')?.demo).toBe(true)
    expect(paths).toContain('/firma')
    expect(paths).toContain('/crew')
    expect(homeDiscoverHasAccountLinks(tiles)).toBe(false)
    expect(paths.some((p) => p === '/mein' || p.startsWith('/social') || p === '/wallet')).toBe(false)
  })

  it('Mehr discover also omits Mein / Social / Wallet', () => {
    const tiles = mehrDiscoverTiles((k) => tStatic(k, 'de'), adult)
    expect(homeDiscoverHasAccountLinks(tiles)).toBe(false)
    expect(tiles.some((t) => t.to === '/marktplatz')).toBe(true)
  })

  it('Mein hub is account-only and sorted money → identity → create → connect → tools', () => {
    const tiles = meinAccountTiles((k) => tStatic(k, 'de'), adult)
    const ids = tiles.map((t) => t.id)
    expect(ids).toEqual([
      'wallet',
      'profile',
      'verify',
      'prefs',
      'create',
      'offer',
      'channels',
      'ideas',
      'integrations',
      'language',
      'dashboard',
      'kids',
      'refer',
    ])
    expect(meinHasDiscoverLinks(tiles)).toBe(false)
    expect(tiles.find((t) => t.id === 'wallet')?.demo).toBe(true)
    expect(tiles.find((t) => t.id === 'wallet')?.to).toBe('/wallet')
    expect(tiles.find((t) => t.id === 'verify')?.to).toBe('/demo/verify')
    expect(tiles.find((t) => t.id === 'kids')?.demo).toBe(true)
    expect(tiles.find((t) => t.id === 'channels')?.to).toBe('/channels')
    expect(tiles.find((t) => t.id === 'ideas')?.to).toBe('/ideen')
    expect(tiles.find((t) => t.id === 'integrations')?.to).toBe('/integrationen')
    expect(tiles.some((t) => t.to === '/listings/new')).toBe(true)
    expect(tiles.find((t) => t.id === 'create')?.demo).toBeFalsy()
    expect(tiles.find((t) => t.id === 'offer')?.demo).toBeFalsy()
    const refer = tiles.find((t) => t.id === 'refer')
    expect(refer?.emoji).not.toBe('🎁')
    expect(refer?.icon).toBe('share')
    expect(refer?.label).toBe('Orbit weiterempfehlen')
  })

  it('Kids hide Wallet / create / offer on Mein and travel / firma / crew on Home', () => {
    const mein = meinAccountTiles((k) => tStatic(k, 'de'), kids)
    expect(mein.some((t) => t.id === 'wallet' || t.id === 'create' || t.id === 'offer' || t.id === 'refer')).toBe(
      false,
    )
    const home = homeDiscoverTiles((k) => tStatic(k, 'de'), kids)
    expect(home.some((t) => t.id === 'abflug' || t.id === 'firma' || t.id === 'crew' || t.id === 'kabine')).toBe(
      false,
    )
    expect(home.find((t) => t.id === 'campus')?.demo).toBe(true)
    expect(home.find((t) => t.id === 'entdecker')?.demo).toBe(true)
  })

  it('Home discover shows at most three quiet links and folds the rest', () => {
    const split = splitAdaptiveHome(adult, {}, (k) => tStatic(k, 'de'))
    expect(HOME_PRIMARY_COUNT).toBe(3)
    expect(split.primary).toHaveLength(3)
    expect(split.primary.map((t) => t.id)).toEqual(['abflug', 'kabine', 'match'])
    expect(split.primary.find((t) => t.id === 'kabine')?.demo).toBe(true)
    expect(homeDiscoverHasAccountLinks(split.primary)).toBe(false)
    expect(split.folded.some((t) => t.id === 'jobs')).toBe(true)
    const kidsSplit = splitAdaptiveHome(kids, {}, (k) => tStatic(k, 'de'))
    expect(kidsSplit.primary.length).toBeLessThanOrEqual(3)
    expect(kidsSplit.primary.some((t) => t.id === 'abflug' || t.id === 'firma' || t.id === 'crew')).toBe(false)
  })

  it('every catalog tile has a visible emoji', () => {
    expect(everyTileHasEmoji(HOME_DISCOVER_DEFS)).toBe(true)
    expect(everyTileHasEmoji(MEHR_DISCOVER_DEFS)).toBe(true)
    expect(everyTileHasEmoji(MEIN_ACCOUNT_DEFS)).toBe(true)
    expect(everyTileHasEmoji(homeDiscoverTiles((k) => tStatic(k, 'en'), adult))).toBe(true)
    expect(everyTileHasEmoji(meinAccountTiles((k) => tStatic(k, 'en'), adult))).toBe(true)
  })
})
